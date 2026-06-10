import { importHttpRequests } from '../../../../../../src/cmds/query/db/import/httpRequests';
import { buildReturnEventMap } from '../../../../../../src/cmds/query/db/import/returnEventMap';
import { buildParentEventMap } from '../../../../../../src/cmds/query/db/import/parentEventMap';
import { freshDb } from './helpers';

function seedAppmap(db: any): number {
  const info = db
    .prepare("INSERT INTO appmaps (name, source_path) VALUES ('rec', '/tmp/rec.appmap.json')")
    .run();
  return Number(info.lastInsertRowid);
}

describe('importHttpRequests', () => {
  it('inserts one row per http_server_request, joining the matching return for status + elapsed', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      const events = [
        {
          id: 1,
          event: 'call',
          thread_id: 99,
          http_server_request: {
            request_method: 'POST',
            path_info: '/orders',
            normalized_path_info: '/orders',
            protocol: 'HTTP/1.1',
          },
        },
        {
          id: 2,
          event: 'call',
          thread_id: 99,
        },
        {
          id: 3,
          event: 'return',
          parent_id: 2,
        },
        {
          id: 4,
          event: 'return',
          parent_id: 1,
          http_server_response: { status_code: 500, mime_type: 'application/json' },
          elapsed: 0.52,
        },
      ];

      importHttpRequests(
        db,
        appmapId,
        events,
        buildReturnEventMap(events),
        buildParentEventMap(events)
      );

      const row = db.prepare('SELECT * FROM http_requests').get() as any;
      expect(row.method).toBe('POST');
      expect(row.path).toBe('/orders');
      expect(row.normalized_path).toBe('/orders');
      expect(row.protocol).toBe('HTTP/1.1');
      expect(row.status_code).toBe(500);
      expect(row.mime_type).toBe('application/json');
      expect(row.elapsed_ms).toBeCloseTo(520);
      expect(row.thread_id).toBe(99);
      expect(row.parent_event_id).toBeNull();
    } finally {
      db.close();
    }
  });

  it('records status_code 0 when no return event was emitted', () => {
    const db = freshDb();
    try {
      const appmapId = seedAppmap(db);
      const events = [
        {
          id: 1,
          event: 'call',
          http_server_request: { request_method: 'GET', path_info: '/x' },
        },
      ];
      importHttpRequests(
        db,
        appmapId,
        events,
        buildReturnEventMap(events),
        buildParentEventMap(events)
      );
      const row = db.prepare('SELECT status_code, elapsed_ms FROM http_requests').get() as any;
      expect(row.status_code).toBe(0);
      expect(row.elapsed_ms).toBeNull();
    } finally {
      db.close();
    }
  });
});
