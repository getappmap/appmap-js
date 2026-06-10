// Index return events by their associated call event id, so call events can
// look up their elapsed time + return-specific payload (http_server_response,
// http_client_response, return_value).
//
// In the AppMap event stream, each return event carries `parent_id` pointing
// at the id of the call event it terminates.
export interface ReturnEventLike {
  event?: string;
  parent_id?: number;
  elapsed?: number;
  http_server_response?: Record<string, unknown>;
  http_client_response?: Record<string, unknown>;
  return_value?: Record<string, unknown>;
}

export function buildReturnEventMap(
  events: readonly ReturnEventLike[]
): Map<number, ReturnEventLike> {
  const map = new Map<number, ReturnEventLike>();
  for (const ev of events) {
    if (ev.event === 'return' && typeof ev.parent_id === 'number') {
      map.set(ev.parent_id, ev);
    }
  }
  return map;
}
