// Minimal shape of an AppMap event used during parent-link reconstruction.
// We only inspect a few fields, so we keep this loose rather than coupling
// to @appland/models.
export interface AppMapEventLike {
  id?: number;
  thread_id?: number;
  event?: string;
}

// Walk the event stream once and return a map of event_id → parent_event_id
// using per-thread call stacks. Each 'call' event's parent is the top of its
// thread's stack at the moment of the call; each 'return' pops the stack.
//
// Events with no thread_id or no id are skipped. Threads are independent:
// events on different threads never become each other's parents.
export function buildParentEventMap(events: readonly AppMapEventLike[]): Map<number, number> {
  const parentMap = new Map<number, number>();
  const threadStacks = new Map<number, number[]>();

  for (const ev of events) {
    const tid = ev.thread_id;
    const eid = ev.id;
    if (tid === undefined || eid === undefined) continue;

    if (ev.event === 'call') {
      let stack = threadStacks.get(tid);
      if (!stack) {
        stack = [];
        threadStacks.set(tid, stack);
      }
      if (stack.length > 0) parentMap.set(eid, stack[stack.length - 1]);
      stack.push(eid);
    } else if (ev.event === 'return') {
      const stack = threadStacks.get(tid);
      if (stack && stack.length > 0) stack.pop();
    }
  }

  return parentMap;
}
