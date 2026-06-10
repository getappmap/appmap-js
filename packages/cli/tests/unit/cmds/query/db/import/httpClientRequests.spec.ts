import { importHttpClientRequests } from '../../../../../../src/cmds/query/db/import/httpClientRequests';
import { buildReturnEventMap } from '../../../../../../src/cmds/query/db/import/returnEventMap';
import { buildParentEventMap } from '../../../../../../src/cmds/query/db/import/parentEventMap';
import { freshDb } from './helpers';

function seedAppmap(db: any): number {
  const info = db
    .prepare("INSERT INTO appmaps (name, source_path) VALUES ('rec', '/tmp/rec.appmap.json')")
    .run();
  return Number(info.lastInsertRowid);
}

describe('importHttpClientRequests', () => {
  it('inserts one row per http_client_request', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      const events = [
        {
          id: 1,
          event: 'call',
          thread_id: 12,
          http_client_request: { request_method: 'GET', url: 'https://api.example/v1' },
        },
        {
          id: 2,
          event: 'return',
          parent_id: 1,
          http_client_response: { status_code: 503 },
          elapsed: 0.04,
        },
      ];
      importHttpClientRequests(
        db,
        appmapId,
        events,
        buildReturnEventMap(events),
        buildParentEventMap(events)
      );
      const row = db.prepare('SELECT * FROM http_client_requests').get() as any;
      expect(row.method).toBe('GET');
      expect(row.url).toBe('https://api.example/v1');
      expect(row.status_code).toBe(503);
      expect(row.elapsed_ms).toBeCloseTo(40);
      expect(row.thread_id).toBe(12);
    } finally {
      db.close();
    }
  });

  it('defaults missing method to GET and missing url to ""', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      const events = [
        { id: 1, event: 'call', http_client_request: {} },
      ];
      importHttpClientRequests(
        db,
        appmapId,
        events,
        buildReturnEventMap(events),
        buildParentEventMap(events)
      );
      const row = db.prepare('SELECT method, url FROM http_client_requests').get() as any;
      expect(row.method).toBe('GET');
      expect(row.url).toBe('');
    } finally {
      db.close();
    }
  });
});
