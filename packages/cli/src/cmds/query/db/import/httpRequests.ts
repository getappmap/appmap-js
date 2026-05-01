import sqlite3 from 'better-sqlite3';

import type { HttpServerRequest, HttpServerResponse } from '@appland/models';

import type { ReturnEventLike } from './returnEventMap';

// Some recorders carry status_code/mime_type alongside the @appland/models
// HttpServerResponse fields, and we may also see an empty object when no
// return event was emitted. Capture the JSON-as-found here without changing
// the upstream type definitions.
type RawHttpServerResponse = Partial<HttpServerResponse> & {
  status_code?: number;
  mime_type?: string;
};

export function importHttpRequests(
  db: sqlite3.Database,
  appmapId: number,
  events: readonly Record<string, any>[],
  returnEvents: Map<number, ReturnEventLike>,
  parentEventMap: Map<number, number>,
  timestampIso: string
): void {
  const stmt = db.prepare(
    `INSERT INTO http_requests (appmap_id, event_id, thread_id, parent_event_id,
      method, path, normalized_path, protocol, status_code, mime_type,
      elapsed_ms, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const ev of events) {
    const req = ev.http_server_request as HttpServerRequest | undefined;
    if (!req) continue;
    const ret = returnEvents.get(ev.id) ?? {};
    const resp = (ret.http_server_response ?? {}) as RawHttpServerResponse;
    const elapsed = ret.elapsed;

    stmt.run(
      appmapId,
      ev.id,
      ev.thread_id ?? null,
      parentEventMap.get(ev.id) ?? null,
      req.request_method,
      req.path_info,
      req.normalized_path_info ?? null,
      req.protocol ?? null,
      resp.status_code ?? 0,
      resp.mime_type ?? null,
      typeof elapsed === 'number' ? elapsed * 1000 : null,
      timestampIso
    );
  }
}
