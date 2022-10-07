import {
  buildAppMap,
  Event,
  CodeObject as AppMapCodeObject,
  ParameterProperty,
} from '@appland/models';
import assert from 'assert';
import { queue } from 'async';
import { readFile } from 'fs/promises';
import FindCodeObjects from '../../search/findCodeObjects';
import {
  CallEdge,
  EdgeType,
  GraphEdge,
  isCallEdge,
  isReturnEdge,
  ReturnEdge,
} from './edge';
import { SequenceGraph } from './graph';
import Priority from './priority';
import { processFiles } from '../../utils';

type CodeObjectId = string;

export default class SequenceDiagramGenerator {
  private requiredPatterns = new Set<string>();
  private uniquePatterns = new Set<string>();
  private appmaps?: Set<string>;

  public priority = new Priority();
  private requiredCodeObjectIdGroups: Set<CodeObjectId>[] = [];
  private matchingCodeObjectIds = new Set<CodeObjectId>();

  constructor(
    public argv: string[],
    public readonly appmapDir: string,
    public readonly codeObjectPatterns: string[]
  ) {
    const interpretCodeObjectPattern = (pattern: string) => {
      if (pattern.charAt(0) === '+') {
        pattern = pattern.slice(1);
        this.requiredPatterns.add(pattern);
      }

      this.uniquePatterns.add(pattern);
      this.priority.enrollPattern(pattern);
    };

    this.codeObjectPatterns.forEach(interpretCodeObjectPattern);
  }

  async initialize() {
    // Explode the remaining patterns into code objects
    await Promise.all(
      [...this.uniquePatterns]
        .filter((pattern) => !this.requiredPatterns.has(pattern))
        .map(async (codeObjectPattern) => {
          const matches = await new FindCodeObjects(
            this.appmapDir,
            codeObjectPattern
          ).find();
          matches.forEach((match) => {
            this.matchingCodeObjectIds.add(match.codeObject.fqid);
          });
          this.priority.expandPattern(
            codeObjectPattern,
            Array.from(matches.map((match) => match.codeObject.fqid))
          );
        })
    );

    // Collect AppMaps which match every required pattern.
    if (this.requiredPatterns.size > 0) {
      // Figure out which AppMaps these code objects reside in
      const appmapsForRequiredPattern = await Promise.all(
        [...this.requiredPatterns].map(async (codeObjectPattern) => {
          const matches = await new FindCodeObjects(
            this.appmapDir,
            codeObjectPattern
          ).find();
          const codeObjectIds = new Set<CodeObjectId>();
          const appmaps = new Set<string>();
          matches.forEach((match) => {
            appmaps.add(match.appmap);
            codeObjectIds.add(match.codeObject.fqid);
            this.matchingCodeObjectIds.add(match.codeObject.fqid);
          });
          this.requiredCodeObjectIdGroups.push(codeObjectIds);
          this.priority.expandPattern(
            codeObjectPattern,
            Array.from(codeObjectIds)
          );
          return appmaps;
        })
      );

      this.appmaps = new Set();
      const firstSet = appmapsForRequiredPattern.pop();
      if (firstSet) {
        for (const appmap of firstSet) {
          // every is true for empty arrays
          if (
            appmapsForRequiredPattern.every((appmaps) => appmaps.has(appmap))
          ) {
            this.appmaps.add(appmap);
          }
        }
      }
    } else {
      this.appmaps = new Set();
      await processFiles(
        `${this.appmapDir}/**/*.appmap.json`,
        (file: string, cb: () => void) => {
          this.appmaps?.add(file.slice(0, file.length - '.appmap.json'.length));
          cb();
        }
      );
    }
  }

  async generate(): Promise<SequenceGraph[]> {
    assert(this.appmaps, `appmapsWithAllCodeObjects is not defined`);

    const graphs: SequenceGraph[] = [];
    const diagramQueue = queue(
      (appmapFile: string, cb: () => void) =>
        this.buildDiagram(graphs, appmapFile).then(cb).catch(cb),
      5
    );
    for (const appmap of this.appmaps) diagramQueue.push(appmap);
    diagramQueue.error((err) => console.warn(err));
    await diagramQueue.drain();
    return graphs;
  }

  protected async buildDiagram(
    graphs: SequenceGraph[],
    appmapFile: string
  ): Promise<void> {
    console.log(`Building sequence diagram for ${appmapFile}`);
    const stack: Array<Event> = [];
    const eventSequence: GraphEdge[] = [];
    const appmap = buildAppMap()
      .source(await readFile([appmapFile, 'appmap.json'].join('.'), 'utf-8'))
      .build();
    const isRoot = (event: Event): boolean =>
      event.codeObject.labels.has('job') ||
      event.codeObject.labels.has('command') ||
      event.codeObject.type === 'route';

    const returnMessage = (
      event: Event,
      properties?: ParameterProperty[]
    ): { message?: string; messageType?: string } => {
      if (properties) {
        const outputProperties = properties
          .slice(0, 3)
          .map((p) => [p.name, p.class].join(':'))
          .sort();
        if (properties.length > 3) outputProperties.push('...');
        return {
          message: `{` + outputProperties.join(',') + `}`,
          messageType: 'struct',
        };
      } else if (event.returnValue) {
        return {
          message: event.returnValue.value,
          messageType: event.returnValue.class,
        };
      } else if (event.exceptions?.length > 0) {
        return {
          message: event.exceptions?.map((e) => e.message)?.join(','),
          messageType: 'exception',
        };
      }

      return {};
    };

    const graphEventForAppMapEvent = new Map<number, GraphEdge>();

    appmap.events.forEach((event) => {
      let matchingCodeObjectId: CodeObjectId | undefined;
      // Always start the sequence diagram with a command or request.
      if (isRoot(event)) {
        this.matchingCodeObjectIds.add(event.codeObject.parent!.fqid);
        matchingCodeObjectId = event.codeObject.fqid;
      }
      if (!matchingCodeObjectId && stack.length === 0) return;

      matchingCodeObjectId ||= this.matchingCodeObjectIdOfEvent(event);
      if (!matchingCodeObjectId) return;

      if (event.isCall()) {
        const caller = stack[stack.length - 1];
        const callee = event;
        stack.push(event);
        if (stack.length >= 2) {
          const graphEvent = {
            type: EdgeType.Call,
            caller,
            callee,
            message: callee.codeObject.name,
            hasResponse: !!returnMessage(callee),
          } as CallEdge;
          graphEventForAppMapEvent.set(event.id, graphEvent);
          eventSequence.push(graphEvent);
        }
      } else {
        if (stack.length >= 2) {
          const caller = stack[stack.length - 1];
          const callee = stack[stack.length - 2];
          const { message, messageType } = returnMessage(
            caller,
            callee.returnValue?.properties
          );
          const graphCallEvent = graphEventForAppMapEvent.get(
            caller.callEvent.id
          );
          assert(
            graphCallEvent,
            `Graph event not found for AppMap event ${caller.callEvent.id}`
          );
          eventSequence.push({
            type: EdgeType.Return,
            caller,
            callee,
            message,
            messageType,
            callEdge: graphCallEvent,
          } as ReturnEdge);
        }
        stack.pop();
      }
    });

    const edges: GraphEdge[] = [];
    {
      const callStack: GraphEdge[] = [];
      let numberOfRequiredCodeObjectsInStack = 0;
      const includedEdges = new Set<GraphEdge>();
      eventSequence.forEach((edge) => {
        if (isCallEdge(edge)) {
          const calleeCodeObjectId = this.matchingCodeObjectIdOfEvent(
            edge.callee
          );
          if (
            calleeCodeObjectId &&
            [...this.requiredCodeObjectIdGroups].find((ids) =>
              ids.has(calleeCodeObjectId)
            )
          ) {
            if (numberOfRequiredCodeObjectsInStack === 0) {
              // Mark ancestors as included
              callStack.forEach((edge) => includedEdges.add(edge));
            }
            numberOfRequiredCodeObjectsInStack += 1;
          }
          if (
            numberOfRequiredCodeObjectsInStack > 0 ||
            this.requiredPatterns.size === 0
          ) {
            includedEdges.add(edge);
          }
          callStack.push(edge);
        } else {
          callStack.pop();

          const callerCodeObjectId = this.matchingCodeObjectIdOfEvent(
            edge.caller
          );
          if (
            callerCodeObjectId &&
            [...this.requiredCodeObjectIdGroups.values()].find((ids) =>
              ids.has(callerCodeObjectId)
            )
          ) {
            numberOfRequiredCodeObjectsInStack -= 1;
          }
        }
      });

      eventSequence.forEach((edge) => {
        if (isCallEdge(edge)) {
          if (includedEdges.has(edge)) edges.push(edge);
        } else if (isReturnEdge(edge)) {
          if (includedEdges.has(edge.callEdge)) edges.push(edge);
        }
      });
    }

    if (edges.length > 0) {
      const graph = { appmapFile, edges } as SequenceGraph;
      graphs.push(graph);
    }
  }

  public matchingCodeObjectOfEvent(event: Event): AppMapCodeObject | undefined {
    let co: AppMapCodeObject | undefined = event.codeObject;
    while (co) {
      if (this.matchingCodeObjectIds.has(co.fqid)) {
        return co;
      } else {
        co = co.parent;
      }
    }
  }

  private matchingCodeObjectIdOfEvent(event: Event): CodeObjectId | undefined {
    return this.matchingCodeObjectOfEvent(event)?.fqid;
  }
}
