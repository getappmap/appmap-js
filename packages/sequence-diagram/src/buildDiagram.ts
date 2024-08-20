import { AppMap, Event } from '@appland/models';
import { classNameToOpenAPIType } from '@appland/openapi';
import sha256 from 'crypto-js/sha256.js';
import { LRUCache } from 'lru-cache';
import { merge } from './mergeWindow';
import { selectEvents } from './selectEvents';
import Specification from './specification';
import {
  Action,
  Actor,
  Diagram,
  NodeType,
  FunctionCall,
  ReturnValue,
  setParent,
  Type,
  ServerRPC,
  ClientRPC,
  Query,
} from './types';

const MAX_WINDOW_SIZE = 5;

const parsedSqlCache = new LRUCache<string, any>({ max: 1000 });
const sha256Cache = new LRUCache<string, string>({ max: 1000 });

class ActorManager {
  private _actorsByCodeObjectId = new Map<string, Actor>();
  private _actors: Actor[] = [];

  constructor(private specification: Specification) {}

  findOrCreateActor(event: Event): Actor | undefined {
    const actorCodeObject = this.specification.isIncludedCodeObject(event.codeObject);
    if (!actorCodeObject) throw Error('actor code object not found');
    const order = this.specification.priorityOf(actorCodeObject);

    const actorKey = actorCodeObject.fqid;

    let actor = this._actorsByCodeObjectId.get(actorKey);
    if (actor) return actor;

    actor = {
      id: actorCodeObject.fqid,
      name: actorCodeObject.name,
      order,
    } as Actor;
    this._actors.push(actor);
    this._actorsByCodeObjectId.set(actorKey, actor);
    return actor;
  }

  getSortedActors(): Actor[] {
    return this._actors.sort((a, b) => a.order - b.order);
  }
}

export default function buildDiagram(
  _appmapFile: string,
  appmap: AppMap,
  specification: Specification
): Diagram {
  const events = selectEvents(appmap, specification);
  const actorManager = new ActorManager(specification);

  function buildRequest(caller?: Event | undefined, callee?: Event): Action | undefined {
    if (callee?.httpServerRequest && callee?.httpServerResponse) {
      if (!callee.route) throw Error('callee.route not found');
      const response = callee.httpServerResponse as any;
      return {
        nodeType: NodeType.ServerRPC,
        callee: actorManager.findOrCreateActor(callee),
        route: callee.route,
        status: response.status || response.status_code,
        digest: callee.buildStableHash(parsedSqlCache).digest(),
        subtreeDigest: 'undefined',
        children: [],
        elapsed: callee.elapsedTime,
        eventIds: [callee.id],
      } as ServerRPC;
    } else if (callee?.httpClientRequest && callee?.httpClientResponse) {
      if (!callee.route) throw Error('callee.route not found');
      const response = callee.httpClientResponse as any;
      return {
        nodeType: NodeType.ClientRPC,
        caller: caller ? actorManager.findOrCreateActor(caller) : undefined,
        callee: actorManager.findOrCreateActor(callee),
        route: callee.route,
        status: response.status || response.status_code,
        digest: callee.buildStableHash(parsedSqlCache).digest(),
        subtreeDigest: 'undefined',
        children: [],
        elapsed: callee.elapsedTime,
        eventIds: [callee.id],
      } as ClientRPC;
    } else if (callee?.sqlQuery) {
      const truncatedQuery = callee.sqlQuery.endsWith('...');
      return {
        nodeType: NodeType.Query,
        caller: caller ? actorManager.findOrCreateActor(caller) : undefined,
        callee: actorManager.findOrCreateActor(callee),
        query: callee.sqlQuery,
        digest: truncatedQuery ? 'truncatedQuery' : callee.buildStableHash(parsedSqlCache).digest(),
        subtreeDigest: 'undefined',
        children: [],
        elapsed: callee.elapsedTime,
        eventIds: [callee.id],
      } as Query;
    } else if (callee) {
      return {
        nodeType: NodeType.Function,
        caller: caller ? actorManager.findOrCreateActor(caller) : undefined,
        callee: actorManager.findOrCreateActor(callee),
        name: callee.codeObject.name,
        static: callee.codeObject.static,
        digest: callee.buildStableHash(parsedSqlCache).digest(),
        subtreeDigest: 'undefined',
        stableProperties: { ...callee.stableProperties },
        returnValue: buildReturnValue(callee),
        children: [],
        elapsed: callee.elapsedTime,
        eventIds: [callee.id],
      } as FunctionCall;
    }
  }

  function buildReturnValue(callee: Event): ReturnValue | undefined {
    const { returnEvent } = callee;

    if (!returnEvent) return;

    const voidReturn = {
      returnValueType: {
        name: 'void',
      },
      raisesException: false,
    } as ReturnValue;

    let returnValueType: Type | undefined;
    const raisesException = returnEvent.exceptions?.length > 0;

    if (!returnEvent.returnValue && !raisesException) return voidReturn;

    if (returnEvent.returnValue) {
      let propertyNames: string[] | undefined;
      if (returnEvent.returnValue.properties) {
        propertyNames = returnEvent.returnValue.properties
          .map((p) => [p.name, p.class].join(':'))
          .sort();
      }

      const typeName =
        classNameToOpenAPIType(returnEvent.returnValue.class, { strict: true }) ||
        returnEvent.returnValue.class;

      returnValueType = {
        name: typeName,
        properties: propertyNames,
      };
    }

    return {
      returnValueType,
      raisesException,
    };
  }

  const codeObjectIds = new Set<string>();
  const codeObjectSequence = new Map<string, number>();
  const requestStack: (Action | undefined)[] = [];
  const rootActions: Action[] = [];
  const eventStack: Event[] = [];
  const allMessages = new Array<Action>();
  events.forEach((event: Event) => {
    if (!codeObjectIds.has(event.codeObject.fqid)) {
      codeObjectSequence.set(event.codeObject.fqid, codeObjectSequence.size);
      codeObjectIds.add(event.codeObject.fqid);
    }
    if (event.isCall()) {
      eventStack.push(event);
      const caller = eventStack[eventStack.length - 2];
      const request = buildRequest(caller, event);
      if (request) {
        const parent = requestStack[requestStack.length - 1];
        if (parent) {
          parent.children.push(request);
        } else {
          rootActions.push(request);
        }
        allMessages.push(request);
      }
      requestStack.push(request);
    } else {
      requestStack.pop();
      eventStack.pop();
    }
  });

  // Combine the digests of children into the parent digest.
  // Do this recursively.
  const buildSubtreeDigests = (node: Action): void => {
    const hashEntries = [node.digest];
    node.children.forEach((child) => {
      buildSubtreeDigests(child);

      hashEntries.push(child.subtreeDigest);
    });
    const hashInput = hashEntries.join('\n');
    let sha256Digest = sha256Cache.get(hashInput);
    if (!sha256Digest) {
      sha256Digest = sha256(hashInput).toString();
      sha256Cache.set(hashInput, sha256Digest);
    }
    node.subtreeDigest = sha256Digest;
  };

  const detectLoops = (node: Action): void => {
    node.children.forEach((child) => detectLoops(child));

    if (node.children.length < 2) return;

    let windowSize = 1;
    while (windowSize <= MAX_WINDOW_SIZE) {
      const mergedChildren = merge(node.children, windowSize);
      if (mergedChildren) {
        node.children = mergedChildren;
      } else {
        windowSize += 1;
      }
    }
  };

  rootActions.forEach((root) => buildSubtreeDigests(root));
  if (specification.loops) rootActions.forEach((root) => detectLoops(root));
  rootActions.forEach((root) => setParent(root));

  return {
    actors: actorManager.getSortedActors(),
    rootActions,
  };
}

export function getActors(appmap: AppMap, specification: Specification): Actor[] {
  const actorManager = new ActorManager(specification);
  const events = selectEvents(appmap, specification);
  events.forEach((event) => actorManager.findOrCreateActor(event));
  return actorManager.getSortedActors();
}
