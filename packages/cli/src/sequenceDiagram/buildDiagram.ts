import { AppMap, Event } from '@appland/models';
import { classNameToOpenAPIType } from '@appland/openapi';
import assert from 'assert';
import { createHash } from 'crypto';
import { request } from 'http';
import { selectEvents } from './selectEvents';
import Specification from './specification';
import {
  Action,
  Actor,
  countDescendants,
  Diagram,
  Loop,
  NodeType,
  Request,
  Response,
  Type,
  WebRequest,
} from './types';

class MergeWindow {
  previous: Action[] | undefined;
  loop: Action[][] = [];
  digest: string | undefined;

  constructor(public size: number) {}

  initialize(actions: Action[]): void {
    this.previous = actions.slice(0, this.size);
    this.loop = [this.previous];

    const hash = createHash('sha256');
    this.previous.forEach((action) => hash.update(action.detailDigest));
    this.digest = hash.digest('hex');
  }

  match(actions: Action[]): boolean {
    const hash = createHash('sha256');
    actions.forEach((action) => hash.update(action.detailDigest));
    const match = this.digest === hash.digest('hex');
    if (match) {
      this.loop.push(actions);
    }
    return match;
  }

  collect(newChildren: Action[]): void {
    if (this.loop.length > 1) {
      newChildren.push({
        nodeType: NodeType.Loop,
        count: this.loop.length,
        detailDigest: this.digest,
        children: this.loop[0],
      } as Loop);
      this.previous = undefined;
      this.loop = [];
      this.digest = undefined;
    } else if (this.loop.length === 1) {
      this.loop[0].forEach((action) => newChildren.push(action));
    }
  }
}

export default function buildDiagram(
  appmapFile: string,
  appmap: AppMap,
  specification: Specification
): Diagram {
  const events = selectEvents(appmap, specification);

  const actors: Actor[] = [];
  const actorsByCodeObjectId = new Map<string, Actor>();
  const actorNums = new Map<string, number>();

  const findOrCreateActor = (event: Event): Actor => {
    const order = specification.priorityOf(event.codeObject);
    const actorCodeObject = specification.isIncludedCodeObject(event.codeObject);
    assert(actorCodeObject, 'actor code object');

    let actorKey: string;
    let displayName: string;
    const isStatic = event.codeObject.static;
    if (event.codeObject.static) {
      actorKey = actorCodeObject.fqid;
      // Bit of a hack for static methods. Some suggest underlining the actor name to
      // indicate static-ness.
      displayName = ['@', actorCodeObject.name].join('');
    } else {
      // This is an experiment to use separate swim lanes for distinct object instances.
      /*
      objectId = actorCodeObject.type === 'class' ? event.receiver?.object_id : undefined;
      actorKey = [actorCodeObject.fqid, objectId].filter(Boolean).join('@');
      if (actorNums.get(actorCodeObject.fqid) !== undefined) {
        actorNums.set(actorCodeObject.fqid, actorNums.get(actorCodeObject.fqid)! + 1);
      } else {
        actorNums.set(actorCodeObject.fqid, 0);
      }
      actorNum = actorNums.get(actorCodeObject.fqid);
      displayName = [actorCodeObject.name, actorNum].filter(Boolean).join(' ');
      */
      actorKey = actorCodeObject.fqid;
      displayName = actorCodeObject.name;
    }

    let actor = actorsByCodeObjectId.get(actorKey);
    if (actor) return actor;

    actor = {
      id: actorCodeObject.fqid,
      name: displayName,
      static: isStatic,
      order,
    } as Actor;
    actors.push(actor);
    actorsByCodeObjectId.set(actorKey, actor);
    return actor;
  };

  function buildRequest(caller: Event | undefined, callee: Event): Action | undefined {
    if (callee.httpServerRequest) {
      assert(callee.route, 'callee.route');
      assert(callee.httpServerResponse, 'callee.httpServerResponse');
      return {
        nodeType: NodeType.WebRequest,
        callee: findOrCreateActor(callee),
        route: callee.route,
        status: callee.httpServerResponse?.status,
        detailDigest: callee.hash,
        descendantCount: 0,
        children: [],
      } as WebRequest;
    } else if (caller && callee) {
      return {
        nodeType: NodeType.Request,
        caller: findOrCreateActor(caller),
        callee: findOrCreateActor(callee),
        name: callee.codeObject.name,
        detailDigest: callee.hash,
        stableProperties: { ...callee.stableProperties },
        response: buildResponse(callee),
        descendantCount: 0,
        children: [],
      } as Request;
    }
  }

  function buildResponse(callee: Event): Response | undefined {
    const { returnEvent } = callee;
    if (!returnEvent) return;
    if (!(returnEvent.returnValue || returnEvent.exceptions.length > 0)) return;

    let returnValueType: Type | undefined;
    const raisesException = returnEvent.exceptions?.length > 0;

    if (returnEvent.returnValue) {
      let propertyNames: string[] | undefined;
      if (returnEvent.returnValue.properties) {
        propertyNames = returnEvent.returnValue.properties
          .map((p) => [p.name, p.class].join(':'))
          .sort();
      }

      const typeName =
        classNameToOpenAPIType(returnEvent.returnValue.class) || returnEvent.returnValue.class;
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
          parent.descendantCount += request.descendantCount + 1;
          request.parent = parent;
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
  const rollupChildren = (node: Action): void => {
    if (node.children.length === 0) return;

    const hash = createHash('sha256');
    hash.update(node.detailDigest);

    node.children.forEach((child) => {
      rollupChildren(child);

      hash.update(child.detailDigest);
    });
    node.detailDigest = hash.digest('hex');
  };
  rootActions.forEach((root) => rollupChildren(root));

  const mergeChildren = (node: Action): void => {
    let children = [...node.children];

    children.forEach((child) => mergeChildren(child));

    if (children.length < 2) return;

    let newChildren: Action[] = [];
    let windowSize = 1;
    while (windowSize < Math.min(5, children.length / 2)) {
      const mergeWindow = new MergeWindow(windowSize);
      mergeWindow.initialize(children);

      for (let index = windowSize; index < children.length; index += windowSize) {
        const nextWindow = children.slice(index, Math.min(children.length, index + windowSize));
        if (!mergeWindow.match(nextWindow)) {
          mergeWindow.collect(newChildren);
          mergeWindow.initialize(nextWindow);
        }
      }

      mergeWindow.collect(newChildren);

      node.children = [...newChildren];
      children = newChildren;
      newChildren = [];
      windowSize += 1;
    }
  };

  rootActions.forEach((root) => mergeChildren(root));

  rootActions.forEach((root) => countDescendants(root));

  return {
    actors: actors.sort((a, b) => a.order - b.order),
    rootActions,
  };
}
