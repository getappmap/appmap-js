import sqlite3 from 'better-sqlite3';

import type { HttpClientRequest, HttpClientResponse } from '@appland/models';

import type { ReturnEventLike } from './returnEventMap';

// Mirror httpRequests.ts: recordings carry a status_code field alongside
// what @appland/models declares, and an empty {} when no return was emitted.
type RawHttpClientResponse = Partial<HttpClientResponse> & { status_code?: number };

export function importHttpClientRequests(
  db: sqlite3.Database,
  appmapId: number,
  events: readonly Record<string, any>[],
  returnEvents: Map<number, ReturnEventLike>,
  parentEventMap: Map<number, number>
): void {
  const stmt = db.prepare(
    `INSERT INTO http_client_requests (appmap_id, event_id, thread_id, parent_event_id,
      method, url, status_code, elapsed_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const ev of events) {
    const req = ev.http_client_request as HttpClientRequest | undefined;
    if (!req) continue;
    const ret = returnEvents.get(ev.id) ?? {};
    const resp = (ret.http_client_response ?? {}) as RawHttpClientResponse;
    const elapsed = ret.elapsed;

    stmt.run(
      appmapId,
      ev.id,
      ev.thread_id ?? null,
      parentEventMap.get(ev.id) ?? null,
      req.request_method ?? 'GET',
      req.url ?? '',
      resp.status_code ?? null,
      typeof elapsed === 'number' ? elapsed * 1000 : null
    );
  }
}
