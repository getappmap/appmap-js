import { CodeObject } from '@appland/models';
import {
  Action,
  actionActors,
  Actor,
  Diagram as SequenceDiagram,
  format,
  FormatType,
  isFunction,
  ServerRPC,
} from '@appland/sequence-diagram';
import assert from 'assert';
import * as async from 'async';
import { link, mkdir, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { basename, join } from 'path';
import { promisify } from 'util';
import { readDiagramFile } from '../cmds/sequenceDiagram/readDiagramFile';
import { exists } from '../utils';
import { RevisionName } from './RevisionName';

type Route = {
  method: string;
  path: string;
  status: number;
};

type QueueJob = { revisionName: RevisionName; action: ServerRPC };

export class OperationReference {
  // Set of all source files, indexed by route ([<METHOD> <PATH> (<STATUS>)]).
  public sourcePathsByOperation = new Map<string, Set<string>>();

  private codeObjectIds = new Set<string>();

  // The queue has concurrency of 1, so it's used to ensure that only one route
  // is processed / updated at a time. It's essential to begin indexing with startIndexing,
  // and to wait for finishIndexing() to complete before continuing.
  private queue: async.QueueObject<QueueJob> | undefined;

  constructor(public outputDir: string) {}

  static operationKey(method: string, path: string, status: number): string {
    return `${method.toUpperCase()} ${path} (${status})`;
  }

  startIndexing() {
    this.queue = async.queue(async (job: QueueJob) => {
      try {
        const { revisionName, action } = job;
        const { subtreeDigest } = action;
        const [baseMethod, path] = action.route.split(' ');
        const method = baseMethod.toUpperCase();

        await this.findOrCreateDiagram(revisionName, subtreeDigest, action);

        await this.saveDiagramLink(
          revisionName,
          { method, path, status: action.status },
          subtreeDigest
        );
      } catch (err) {
        console.warn(err);
      }
    }, 1);
  }

  async findOrCreateDiagram(
    revisionName: RevisionName,
    subtreeDigest: string,
    action: ServerRPC
  ): Promise<SequenceDiagram> {
    if (await exists(this.diagramPath(revisionName, subtreeDigest))) {
      return readDiagramFile(this.diagramPath(revisionName, subtreeDigest));
    }

    const diagram = this.buildDiagram(action);
    await writeFile(
      this.diagramPath(revisionName, subtreeDigest),
      format(FormatType.JSON, diagram, subtreeDigest).diagram
    );
    return diagram;
  }

  async listSequenceDiagrams(revisionName: RevisionName, route: Route): Promise<string[]> {
    const files = await promisify(glob)(
      `${this.operationPath(revisionName, route)}/*.sequence.json`
    );
    return files.map((file) => basename(file, '.sequence.json'));
  }

  async loadSequenceDiagram(
    revisionName: RevisionName,
    subtreeDigest: string
  ): Promise<SequenceDiagram> {
    const diagramPath = this.diagramPath(revisionName, subtreeDigest);
    return readDiagramFile(diagramPath);
  }

  async finishIndexing() {
    if (!this.queue) return;

    await this.queue.drain();
    this.queue = undefined;
  }

  addSourcePath(key: string, path: string, codeObject: CodeObject): void {
    if (!this.sourcePathsByOperation.get(key))
      this.sourcePathsByOperation.set(key, new Set<string>());
    this.sourcePathsByOperation.get(key)!.add(path);

    let co: CodeObject | undefined = codeObject;
    while (co) {
      this.codeObjectIds.add(co.fqid);
      co = co.parent;
    }
  }

  addServerRPC(revisionName: RevisionName, action: ServerRPC) {
    assert(this.queue, 'OperationReference is not in processing mode');

    this.queue.push({ revisionName, action });
  }

  private buildDiagram(rootAction: Action): SequenceDiagram {
    const validSourceLocation = (action: Action) => {
      if (!isFunction(action)) return true;

      return this.codeObjectIds.has(action.callee.id);
    };

    const filterAction = (action: Action, parent: Action | undefined) => {
      let actionClone: Action | undefined;
      if (validSourceLocation(action)) {
        actionClone = cloneAction(action);
        if (parent) {
          actionClone.parent = parent;
          parent.children.push(actionClone);
        }
        parent = actionClone;
      }

      action.children.forEach((child) => filterAction(child, parent));

      return actionClone;
    };

    const rootActionClone = filterAction(rootAction, undefined);
    assert(rootActionClone);

    const actors = new Array<Actor>();
    const actorIds = new Set<string>();

    const collectActors = (action: Action) => {
      actionActors(action).forEach((actor) => {
        if (!actor) return;

        if (!actorIds.has(actor.id)) {
          actorIds.add(actor.id);
          actors.push(actor);
        }
      });

      action.children.forEach(collectActors);
    };
    collectActors(rootActionClone);

    return {
      actors,
      rootActions: [rootActionClone],
    };
  }

  private async saveDiagramLink(revisionName: RevisionName, route: Route, subtreeDigest: string) {
    await mkdir(this.operationPath(revisionName, route), {
      recursive: true,
    });

    const targetPath = join(
      this.operationPath(revisionName, route),
      [subtreeDigest, 'sequence.json'].join('.')
    );
    if (await exists(targetPath)) return;

    await link(this.diagramPath(revisionName, subtreeDigest), targetPath);
  }

  private operationPath(revisionName: RevisionName, route: Route): string {
    let { path } = route;
    // To avoid a conflict with a real route, use a character that's invalid in a URL.
    // The mneumonic for '^' is that it's used in regexp to start a line.
    if (path === '/') path = '^';

    return join(
      this.outputDir,
      revisionName,
      'operations',
      route.method.toUpperCase(),
      path,
      route.status.toString()
    );
  }

  private diagramPath(revisionName: RevisionName, subtreeDigest: string): string {
    return join(
      this.outputDir,
      revisionName,
      'operations',
      'sequence-diagrams',
      [subtreeDigest, 'sequence.json'].join('.')
    );
  }
}

function cloneAction(action: Action): Action {
  const { children, caller, callee } = action as any;

  let { parent } = action as any;
  if (caller) (action as any).caller = undefined;
  if (callee) (action as any).callee = undefined;
  action.parent = undefined;
  action.children = [];
  const actionClone = JSON.parse(JSON.stringify(action));
  assert(actionClone);
  action.children = children;
  action.parent = parent;
  if (caller) (action as any).caller = caller;
  if (callee) (action as any).callee = callee;
  if (caller) (actionClone as any).caller = caller;
  if (callee) (actionClone as any).callee = callee;

  return actionClone;
}
