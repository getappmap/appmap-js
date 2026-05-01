import sqlite3 from 'better-sqlite3';

import type { SqlQuery } from '@appland/models';

import type { ReturnEventLike } from './returnEventMap';

// Import sql_query events. The caller class/method is taken from the event
// itself when present; otherwise it's derived from the parent call event in
// the per-thread call stack (matches the Python prototype).
export function importSqlQueries(
  db: sqlite3.Database,
  appmapId: number,
  events: readonly Record<string, any>[],
  returnEvents: Map<number, ReturnEventLike>,
  parentEventMap: Map<number, number>
): void {
  // event_id → call event, for parent-callsite lookup.
  const callEvents = new Map<number, Record<string, any>>();
  for (const ev of events) {
    if (ev.event === 'call' && typeof ev.id === 'number') callEvents.set(ev.id, ev);
  }

  const stmt = db.prepare(
    `INSERT INTO sql_queries (appmap_id, event_id, thread_id, parent_event_id,
      sql_text, database_type, server_version, caller_class, caller_method,
      elapsed_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const ev of events) {
    const sq = ev.sql_query as SqlQuery | undefined;
    if (!sq) continue;
    const ret = returnEvents.get(ev.id) ?? {};
    const elapsed = ret.elapsed;

    let callerClass: string | null = ev.defined_class ?? null;
    let callerMethod: string | null = ev.method_id ?? null;
    if (!callerClass) {
      const parentEid = parentEventMap.get(ev.id);
      if (parentEid !== undefined) {
        const parent = callEvents.get(parentEid);
        if (parent) {
          callerClass = parent.defined_class ?? null;
          callerMethod = parent.method_id ?? null;
        }
      }
    }

    stmt.run(
      appmapId,
      ev.id,
      ev.thread_id ?? null,
      parentEventMap.get(ev.id) ?? null,
      sq.sql,
      sq.database_type ?? null,
      sq.server_version ?? null,
      callerClass,
      callerMethod,
      typeof elapsed === 'number' ? elapsed * 1000 : null
    );
  }
}
