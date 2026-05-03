import sqlite3 from 'better-sqlite3';

import type { ExceptionObject } from '@appland/models';

// Import exceptions into the exceptions table.
//
// In the AppMap event stream, `exceptions` lives on **return** events: the
// return event terminates a call, and any thrown exception that propagated
// is attached there. The row's `event_id` and `parent_event_id` should
// describe the **call** the exception belongs to, not the return event:
//
//   - event_id        = call event id     (= ev.parent_id on the return)
//   - parent_event_id = parent of that call in the per-thread stack
//                       (= parentEventMap.get(callEventId))
//
// Some recorders also place `exceptions` directly on the call event itself.
// We accept that legacy shape but de-dup against the canonical return-event
// source: if a call id was already covered via its return event, we skip
// the call-event source for the same id.
export function importExceptions(
  db: sqlite3.Database,
  appmapId: number,
  events: readonly Record<string, any>[],
  parentEventMap: Map<number, number>
): void {
  const stmt = db.prepare(
    `INSERT INTO exceptions (appmap_id, event_id, return_event_id, thread_id,
      parent_event_id, exception_class, message, path, lineno)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const seenCallIds = new Set<number>();

  // Pass 1: return events carrying exceptions (canonical case).
  for (const ev of events) {
    if (ev.event !== 'return') continue;
    const excs = ev.exceptions as ExceptionObject[] | undefined;
    if (!Array.isArray(excs)) continue;
    if (typeof ev.parent_id !== 'number') continue;

    const callEventId = ev.parent_id;
    const returnEventId = typeof ev.id === 'number' ? ev.id : null;
    seenCallIds.add(callEventId);
    const parentEventId = parentEventMap.get(callEventId) ?? null;

    for (const exc of excs) {
      stmt.run(
        appmapId,
        callEventId,
        returnEventId,
        ev.thread_id ?? null,
        parentEventId,
        exc.class,
        exc.message ?? null,
        exc.path ?? null,
        exc.lineno ?? null
      );
    }
  }

  // Pass 2: legacy shape — exceptions on a call event we didn't already cover.
  // No paired return event in this shape, so return_event_id stays null.
  for (const ev of events) {
    if (ev.event !== 'call') continue;
    const excs = ev.exceptions as ExceptionObject[] | undefined;
    if (!Array.isArray(excs)) continue;
    if (typeof ev.id !== 'number' || seenCallIds.has(ev.id)) continue;

    const parentEventId = parentEventMap.get(ev.id) ?? null;

    for (const exc of excs) {
      stmt.run(
        appmapId,
        ev.id,
        null,
        ev.thread_id ?? null,
        parentEventId,
        exc.class,
        exc.message ?? null,
        exc.path ?? null,
        exc.lineno ?? null
      );
    }
  }
}
