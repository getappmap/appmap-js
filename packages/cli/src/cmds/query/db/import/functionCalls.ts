import sqlite3 from 'better-sqlite3';

import type { ReturnEventLike } from './returnEventMap';

// Import function call events. Each event is linked to a code_object via
// (path, lineno) → classMap location, and gains parameter / return-value
// capture iff the linked code_object has any labels.
export function importFunctionCalls(
  db: sqlite3.Database,
  appmapId: number,
  events: readonly Record<string, any>[],
  returnEvents: Map<number, ReturnEventLike>,
  parentEventMap: Map<number, number>,
  codeObjectLookup: Map<string, number>
): void {
  // Set of code_object_ids that have labels — narrows param capture to the
  // functions an investigator cares about (log, security.*, dao.*, …).
  const labeledCoIds = new Set<number>();
  if (codeObjectLookup.size > 0) {
    const placeholders = new Array(codeObjectLookup.size).fill('?').join(',');
    const ids = [...codeObjectLookup.values()];
    const rows = db
      .prepare(
        `SELECT DISTINCT code_object_id FROM labels WHERE code_object_id IN (${placeholders})`
      )
      .all(...ids) as { code_object_id: number }[];
    for (const r of rows) labeledCoIds.add(r.code_object_id);
  }

  const stmt = db.prepare(
    `INSERT INTO function_calls (appmap_id, event_id, thread_id, parent_event_id,
      code_object_id, defined_class, method_id, path, lineno, is_static,
      elapsed_ms, parameters_json, return_value)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const ev of events) {
    if (ev.event !== 'call') continue;
    if (!ev.defined_class || !ev.method_id) continue;
    if ('http_server_request' in ev || 'sql_query' in ev) continue;

    const ret = returnEvents.get(ev.id) ?? {};
    const elapsed = ret.elapsed;

    let coId: number | null = null;
    const evPath = ev.path;
    const evLineno = ev.lineno;
    if (evPath != null && evLineno != null) {
      // Lookup key matches the importer's: "<path>:<lineno>|<method_id>".
      // The method component disambiguates classMap entries that share
      // a path:lineno, so two events at the same source location bind to
      // their own code_object rather than colliding.
      coId = codeObjectLookup.get(`${evPath}:${evLineno}|${ev.method_id}`) ?? null;
    }

    let paramsJson: string | null = null;
    let returnVal: string | null = null;
    if (coId !== null && labeledCoIds.has(coId)) {
      const params = ev.parameters;
      if (Array.isArray(params) && params.length > 0) {
        paramsJson = JSON.stringify(
          params.map((p: any) => ({ name: p?.name, class: p?.class, value: p?.value }))
        );
      }
      const rv = (ret as any).return_value;
      if (rv && typeof rv === 'object') {
        const value = rv.value;
        returnVal = value == null ? null : String(value);
      }
    }

    stmt.run(
      appmapId,
      ev.id,
      ev.thread_id ?? null,
      parentEventMap.get(ev.id) ?? null,
      coId,
      ev.defined_class,
      ev.method_id,
      evPath ?? null,
      evLineno ?? null,
      ev.static ? 1 : 0,
      typeof elapsed === 'number' ? elapsed * 1000 : null,
      paramsJson,
      returnVal
    );
  }
}
