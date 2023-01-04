import { AppMap, buildAppMap, HttpServerRequest, SqlQuery } from '@appland/models';

type NodeInfo = { http: string } | { sql: string } | { fn: string };
type MapNode = [NodeInfo, MapNode[]] | NodeInfo;
export type TestMap = MapNode;

type BaseEvent = { id: number };

type BaseCallEvent = BaseEvent & {
  event: 'call';
};

type HttpEvent = BaseCallEvent & {
  http_server_request: HttpServerRequest;
};

type SqlEvent = BaseCallEvent & {
  sql_query: SqlQuery;
};

type FunctionCallEvent = BaseCallEvent & {
  defined_class: string;
  method_id: string;
};

type CallEvent = FunctionCallEvent | HttpEvent | SqlEvent;

type ReturnEvent = BaseEvent & {
  event: 'return';
  parent_id: Event['id'];
};

type Event = CallEvent | ReturnEvent;

function testEvents(node: MapNode): Event[] {
  const [info, children] = node instanceof Array ? node : [node, []];
  const call = makeEvent(info);
  const childEvents = children.flatMap(testEvents);
  return [call, ...childEvents, makeReturn(call)];
}

export default function testMap(root: MapNode): AppMap {
  return buildAppMap({ events: testEvents(root) })
    .normalize()
    .build();
}

const nextId = (() => {
  let eventId = 0;
  return () => {
    eventId += 1;
    return eventId;
  };
})();

function makeEvent(info: NodeInfo): CallEvent {
  const ev = { id: nextId(), event: 'call' } as const;

  if ('http' in info) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [request_method, path_info] = info.http.split(' ', 2);
    return {
      ...ev,
      http_server_request: {
        request_method,
        path_info,
      },
    };
  }

  if ('sql' in info) {
    return { ...ev, sql_query: { sql: info.sql, database_type: 'test' } };
  }

  if ('fn' in info) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [defined_class, method_id] = info.fn.split('.');
    return { ...ev, defined_class, method_id };
  }

  throw new TypeError(`invalid node info`);
}

function makeReturn(call: CallEvent): ReturnEvent {
  return {
    id: nextId(),
    event: 'return',
    parent_id: call.id,
  };
}
