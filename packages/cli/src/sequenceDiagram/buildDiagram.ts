import { AppMap, Event } from '@appland/models';
import { classNameToOpenAPIType } from '@appland/openapi';
import assert from 'assert';
import { inspect } from 'util';
import Priority from './priority';
import { selectEvents } from './selectEvents';
import { Actor, Diagram, NodeType, Request, Response, Type } from './types';

function pluralize(word: string, count: number): string {
  return count === 1 ? word : [word, 's'].join('');
}

export default function buildDiagram(
  appmapFile: string,
  appmap: AppMap,
  priority: Priority,
  includedCodeObjectIds: Set<string>,
  requiredCodeObjectIds: Set<string>
): Diagram {
  const events = selectEvents(appmap, includedCodeObjectIds, requiredCodeObjectIds);

  const actors: Actor[] = [];
  const actorsByCodeObjectId = new Map<string, Actor>();
  const actorNums = new Map<string, number>();

  const findOrCreateActor = (event: Event): Actor => {
    assert(event.codeObject.parent);

    const coid = event.codeObject.parent.fqid;
    const order = priority.priorityOf(coid);

    let actorNum: number | undefined;
    let objectId: number | undefined;
    let actorKey: string;
    let displayName: string;
    const isStatic = event.codeObject.static;
    if (event.codeObject.static) {
      actorKey = coid;
      // Bit of a hack for static methods. Some suggest underlining the actor name to
      // indicate static-ness.
      displayName = ['@', pluralize(event.codeObject.parent.name, 2)].join('');
    } else {
      objectId = event.receiver?.object_id;
      actorKey = [coid, objectId].filter(Boolean).join('@');
      if (actorNums.get(coid) !== undefined) {
        actorNums.set(coid, actorNums.get(coid)! + 1);
      } else {
        actorNums.set(coid, 0);
      }
      actorNum = actorNums.get(coid);
      displayName = [event.codeObject.parent.name, actorNum].filter(Boolean).join(' ');
    }

    let actor = actorsByCodeObjectId.get(actorKey);
    if (actor) return actor;

    actor = {
      id: coid,
      name: displayName,
      static: isStatic,
      order,
    } as Actor;
    actors.push(actor);
    actorsByCodeObjectId.set(actorKey, actor);
    return actor;
  };

  function buildRequest(caller: Event, callee: Event): Request {
    return {
      nodeType: NodeType.Request,
      caller: findOrCreateActor(caller),
      callee: findOrCreateActor(callee),
      name: callee.codeObject.name,
      stableProperties: { ...callee.stableProperties },
    };
  }

  function buildResponse(request: Request, _caller: Event, callee: Event): Response | undefined {
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
      nodeType: NodeType.Response,
      request: request,
      returnValueType,
      raisesException,
    };
  }

  const codeObjectIds = new Set<string>();
  const codeObjectSequence = new Map<string, number>();
  const requestByEvent = new Map<Event, Request>();
  const stack: Event[] = [];
  const messages = new Array<Request | Response>();
  events.forEach((event: Event) => {
    if (!codeObjectIds.has(event.codeObject.fqid)) {
      codeObjectSequence.set(event.codeObject.fqid, codeObjectSequence.size);
      codeObjectIds.add(event.codeObject.fqid);
    }
    if (event.isCall()) {
      stack.push(event);
      if (stack.length >= 2) {
        const caller = stack[stack.length - 2];
        const request = buildRequest(caller, event);
        requestByEvent.set(event, request);
        messages.push(request);
      }
    } else {
      if (stack.length >= 2) {
        const caller = stack[stack.length - 2];
        const request = requestByEvent.get(event.callEvent);
        assert(request, 'request');
        const response = buildResponse(request, caller, event);
        if (response) messages.push(response);
      }
      stack.pop();
    }
  });

  return {
    appmapFile,
    actors: actors.sort((a, b) => a.order - b.order),
    messages,
  };
}
