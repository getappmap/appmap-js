import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

import {
  deleteAppmap,
  importAppmap,
} from '../../../../../../src/cmds/query/db/import/importAppmap';
import { freshDb } from './helpers';

function writeAppmap(dir: string, name: string, body: object): string {
  const p = join(dir, name);
  writeFileSync(p, JSON.stringify(body));
  return p;
}

describe('importAppmap', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'import-appmap-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('imports an end-to-end recording into all tables', () => {
    const db = freshDb();
    try {
      const path = writeAppmap(tmp, 'rec.appmap.json', {
        metadata: {
          name: 'orders_create_42',
          language: { name: 'ruby' },
          frameworks: [{ name: 'rails' }],
          recorder: { type: 'rspec' },
          git: { branch: 'feature/foo', commit: 'abc' },
          timestamp: 1700000000,
        },
        classMap: [
          {
            type: 'package',
            name: 'app',
            children: [
              {
                type: 'class',
                name: 'OrdersController',
                children: [
                  {
                    type: 'function',
                    name: 'create',
                    location: 'app/controllers/orders_controller.rb:42',
                  },
                ],
              },
            ],
          },
        ],
        events: [
          {
            id: 1,
            event: 'call',
            thread_id: 1,
            http_server_request: { request_method: 'POST', path_info: '/orders' },
          },
          {
            id: 2,
            event: 'call',
            thread_id: 1,
            defined_class: 'OrdersController',
            method_id: 'create',
            path: 'app/controllers/orders_controller.rb',
            lineno: 42,
          },
          {
            id: 3,
            event: 'call',
            thread_id: 1,
            sql_query: { sql: 'INSERT INTO orders (...)' },
          },
          { id: 4, event: 'return', parent_id: 3, elapsed: 0.014 },
          {
            id: 5,
            event: 'return',
            parent_id: 2,
            exceptions: [{ class: 'IntegrityError', message: 'duplicate key' }],
          },
          {
            id: 6,
            event: 'return',
            parent_id: 1,
            http_server_response: { status_code: 500 },
            elapsed: 0.52,
          },
        ],
      });

      const result = importAppmap(db, path);
      expect(result.eventCount).toBe(6);
      expect(result.sqlCount).toBe(1);
      expect(result.httpCount).toBe(1);

      const am = db.prepare('SELECT * FROM appmaps').get() as any;
      expect(am.source_path).toBe(resolve(path));
      expect(am.git_branch).toBe('feature/foo');
      expect(am.elapsed_ms).toBeCloseTo(520);

      expect((db.prepare('SELECT COUNT(*) AS n FROM http_requests').get() as any).n).toBe(1);
      expect((db.prepare('SELECT COUNT(*) AS n FROM sql_queries').get() as any).n).toBe(1);
      expect((db.prepare('SELECT COUNT(*) AS n FROM function_calls').get() as any).n).toBe(1);
      expect((db.prepare('SELECT COUNT(*) AS n FROM exceptions').get() as any).n).toBe(1);
      expect((db.prepare('SELECT COUNT(*) AS n FROM code_objects').get() as any).n).toBe(1);
    } finally {
      db.close();
    }
  });

  it('is idempotent on re-import — rows are replaced, not duplicated', () => {
    const db = freshDb();
    try {
      const path = writeAppmap(tmp, 'rec.appmap.json', {
        metadata: { timestamp: 1700000000 },
        events: [
          {
            id: 1,
            event: 'call',
            http_server_request: { request_method: 'GET', path_info: '/x' },
          },
          { id: 2, event: 'return', parent_id: 1, http_server_response: { status_code: 200 } },
        ],
      });
      importAppmap(db, path);
      importAppmap(db, path);
      expect((db.prepare('SELECT COUNT(*) AS n FROM appmaps').get() as any).n).toBe(1);
      expect((db.prepare('SELECT COUNT(*) AS n FROM http_requests').get() as any).n).toBe(1);
    } finally {
      db.close();
    }
  });

  it('rolls back on a parse error, leaving no partial rows', () => {
    const db = freshDb();
    try {
      const path = join(tmp, 'broken.appmap.json');
      writeFileSync(path, '{not valid json');
      expect(() => importAppmap(db, path)).toThrow();
      expect((db.prepare('SELECT COUNT(*) AS n FROM appmaps').get() as any).n).toBe(0);
    } finally {
      db.close();
    }
  });
});

describe('deleteAppmap', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'delete-appmap-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('removes the recording and cascades to child rows', () => {
    const db = freshDb();
    try {
      const path = writeAppmap(tmp, 'rec.appmap.json', {
        metadata: { timestamp: 1700000000 },
        events: [
          {
            id: 1,
            event: 'call',
            http_server_request: { request_method: 'GET', path_info: '/x' },
          },
          { id: 2, event: 'return', parent_id: 1, http_server_response: { status_code: 200 } },
        ],
      });
      importAppmap(db, path);
      expect(deleteAppmap(db, path)).toBe(true);
      expect((db.prepare('SELECT COUNT(*) AS n FROM appmaps').get() as any).n).toBe(0);
      expect((db.prepare('SELECT COUNT(*) AS n FROM http_requests').get() as any).n).toBe(0);
    } finally {
      db.close();
    }
  });

  it('returns false when no matching row exists', () => {
    const db = freshDb();
    try {
      expect(deleteAppmap(db, '/tmp/nonexistent.appmap.json')).toBe(false);
    } finally {
      db.close();
    }
  });
});
