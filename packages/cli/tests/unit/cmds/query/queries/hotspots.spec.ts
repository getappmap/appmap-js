import sqlite3 from 'better-sqlite3';

import { openQueryDb } from '../../../../../src/cmds/query/db/openQueryDb';
import {
  functionHotspots,
  sqlHotspots,
} from '../../../../../src/cmds/query/queries/hotspots';

function freshDb(): sqlite3.Database {
  return openQueryDb('/tmp/ignored', ':memory:').db;
}

interface CallSeed {
  event_id: number;
  parent_event_id?: number;
  defined_class: string;
  method_id: string;
  fqid?: string;
  elapsed_ms: number;
}

function seedRecording(
  db: sqlite3.Database,
  opts: {
    name: string;
    branch?: string;
    request?: { event_id: number; method: string; path: string; status: number };
    calls?: CallSeed[];
    queries?: Array<{ event_id: number; parent_event_id?: number; sql: string; elapsed_ms: number }>;
  }
): number {
  const am = db
    .prepare(
      `INSERT INTO appmaps (name, source_path, git_branch) VALUES (?, ?, ?)`
    )
    .run(opts.name, `/tmp/${opts.name}.appmap.json`, opts.branch ?? null);
  const aid = Number(am.lastInsertRowid);

  if (opts.request) {
    db.prepare(
      `INSERT INTO http_requests (appmap_id, event_id, method, path, status_code)
       VALUES (?, ?, ?, ?, ?)`
    ).run(aid, opts.request.event_id, opts.request.method, opts.request.path, opts.request.status);
  }

  for (const c of opts.calls ?? []) {
    const fqid = c.fqid ?? `${c.defined_class}#${c.method_id}`;
    const dotIdx = c.defined_class.lastIndexOf('.');
    const pkg = dotIdx >= 0 ? c.defined_class.slice(0, dotIdx).replace(/\./g, '/') : '';
    const leaf = dotIdx >= 0 ? c.defined_class.slice(dotIdx + 1) : c.defined_class;
    db.prepare(
      `INSERT OR IGNORE INTO code_objects (fqid, package, classes, leaf_class, method, is_static)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(fqid, pkg, JSON.stringify([leaf]), leaf, c.method_id, 0);
    const coId = (db
      .prepare(`SELECT id FROM code_objects WHERE fqid = ?`)
      .get(fqid) as { id: number }).id;
    db.prepare(
      `INSERT INTO function_calls (appmap_id, event_id, parent_event_id,
         code_object_id, defined_class, method_id, elapsed_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(aid, c.event_id, c.parent_event_id ?? null, coId, c.defined_class, c.method_id, c.elapsed_ms);
  }

  for (const q of opts.queries ?? []) {
    db.prepare(
      `INSERT INTO sql_queries (appmap_id, event_id, parent_event_id, sql_text, elapsed_ms)
       VALUES (?, ?, ?, ?, ?)`
    ).run(aid, q.event_id, q.parent_event_id ?? null, q.sql, q.elapsed_ms);
  }

  return aid;
}

describe('functionHotspots', () => {
  it('groups by code_object_id and ranks by total_ms desc', () => {
    const db = freshDb();
    try {
      seedRecording(db, {
        name: 'a',
        calls: [
          { event_id: 1, defined_class: 'X', method_id: 'fast', fqid: 'app/X#fast', elapsed_ms: 5 },
          { event_id: 2, defined_class: 'X', method_id: 'fast', fqid: 'app/X#fast', elapsed_ms: 5 },
          { event_id: 3, defined_class: 'Y', method_id: 'slow', fqid: 'app/Y#slow', elapsed_ms: 100 },
        ],
      });
      const rows = functionHotspots(db, {});
      expect(rows[0].fqid).toBe('app/Y#slow');
      expect(rows[0].calls).toBe(1);
      expect(rows[0].total_ms).toBe(100);
      expect(rows[1].fqid).toBe('app/X#fast');
      expect(rows[1].calls).toBe(2);
      expect(rows[1].total_ms).toBe(10);
    } finally {
      db.close();
    }
  });

  it('computes self_ms as elapsed minus the sum of immediate children', () => {
    const db = freshDb();
    try {
      // outer call (10) calls inner1 (3) and inner2 (4) and an SQL (1).
      // self_ms(outer) should be 10 - (3 + 4 + 1) = 2.
      seedRecording(db, {
        name: 'a',
        calls: [
          { event_id: 1, defined_class: 'X', method_id: 'outer', fqid: 'app/X#outer', elapsed_ms: 10 },
          { event_id: 2, parent_event_id: 1, defined_class: 'X', method_id: 'inner1', fqid: 'app/X#inner1', elapsed_ms: 3 },
          { event_id: 3, parent_event_id: 1, defined_class: 'X', method_id: 'inner2', fqid: 'app/X#inner2', elapsed_ms: 4 },
        ],
        queries: [{ event_id: 4, parent_event_id: 1, sql: 'SELECT 1', elapsed_ms: 1 }],
      });
      const outer = functionHotspots(db, {}).find((r) => r.fqid === 'app/X#outer')!;
      expect(outer.total_ms).toBe(10);
      expect(outer.self_ms).toBe(2);
      const inner1 = functionHotspots(db, {}).find((r) => r.fqid === 'app/X#inner1')!;
      expect(inner1.self_ms).toBe(3); // leaf — self equals total
    } finally {
      db.close();
    }
  });

  it('aggregates across recordings', () => {
    const db = freshDb();
    try {
      seedRecording(db, {
        name: 'a',
        calls: [{ event_id: 1, defined_class: 'X', method_id: 'm', fqid: 'app/X#m', elapsed_ms: 10 }],
      });
      seedRecording(db, {
        name: 'b',
        calls: [{ event_id: 1, defined_class: 'X', method_id: 'm', fqid: 'app/X#m', elapsed_ms: 20 }],
      });
      const rows = functionHotspots(db, {});
      expect(rows).toHaveLength(1);
      expect(rows[0].calls).toBe(2);
      expect(rows[0].total_ms).toBe(30);
    } finally {
      db.close();
    }
  });

  it('--route scopes to recordings with a matching server request', () => {
    const db = freshDb();
    try {
      seedRecording(db, {
        name: 'reports',
        request: { event_id: 0, method: 'GET', path: '/reports', status: 200 },
        calls: [{ event_id: 1, defined_class: 'R', method_id: 'calc', fqid: 'app/R#calc', elapsed_ms: 100 }],
      });
      seedRecording(db, {
        name: 'orders',
        request: { event_id: 0, method: 'POST', path: '/orders', status: 200 },
        calls: [{ event_id: 1, defined_class: 'O', method_id: 'create', fqid: 'app/O#create', elapsed_ms: 50 }],
      });
      const rows = functionHotspots(db, { route: 'GET /reports' });
      expect(rows).toHaveLength(1);
      expect(rows[0].fqid).toBe('app/R#calc');
    } finally {
      db.close();
    }
  });

  it('--class filters by defined_class', () => {
    const db = freshDb();
    try {
      seedRecording(db, {
        name: 'a',
        calls: [
          { event_id: 1, defined_class: 'OrdersController', method_id: 'create', elapsed_ms: 100 },
          { event_id: 2, defined_class: 'OrdersController', method_id: 'index', elapsed_ms: 50 },
          { event_id: 3, defined_class: 'UsersController', method_id: 'show', elapsed_ms: 200 },
        ],
      });
      const rows = functionHotspots(db, { className: 'OrdersController' });
      expect(rows.map((r) => r.method_id).sort()).toEqual(['create', 'index']);
    } finally {
      db.close();
    }
  });

  it('--class also matches via the canonical fqid (not just defined_class)', () => {
    const db = freshDb();
    try {
      seedRecording(db, {
        name: 'a',
        calls: [
          {
            event_id: 1,
            defined_class: 'org.example.UserRepository',
            method_id: 'findById',
            fqid: 'org/example/UserRepository#findById',
            elapsed_ms: 100,
          },
          {
            event_id: 2,
            defined_class: 'org.example.OrderRepository',
            method_id: 'findById',
            fqid: 'org/example/OrderRepository#findById',
            elapsed_ms: 50,
          },
        ],
      });
      const rows = functionHotspots(db, { className: 'UserRepository' });
      expect(rows).toHaveLength(1);
      expect(rows[0].fqid).toBe('org/example/UserRepository#findById');
    } finally {
      db.close();
    }
  });

  it('--limit truncates the result set', () => {
    const db = freshDb();
    try {
      seedRecording(db, {
        name: 'a',
        calls: [
          { event_id: 1, defined_class: 'X', method_id: 'a', elapsed_ms: 100 },
          { event_id: 2, defined_class: 'X', method_id: 'b', elapsed_ms: 50 },
          { event_id: 3, defined_class: 'X', method_id: 'c', elapsed_ms: 25 },
        ],
      });
      expect(functionHotspots(db, { limit: 2 })).toHaveLength(2);
    } finally {
      db.close();
    }
  });
});

describe('sqlHotspots', () => {
  it('groups by sql_text, ranks by total_ms desc', () => {
    const db = freshDb();
    try {
      seedRecording(db, {
        name: 'a',
        queries: [
          { event_id: 1, sql: 'SELECT * FROM users WHERE id = ?', elapsed_ms: 2 },
          { event_id: 2, sql: 'SELECT * FROM users WHERE id = ?', elapsed_ms: 2 },
          { event_id: 3, sql: 'SELECT * FROM tenants WHERE slug = ?', elapsed_ms: 80 },
        ],
      });
      const rows = sqlHotspots(db, {});
      expect(rows[0].sql_text).toBe('SELECT * FROM tenants WHERE slug = ?');
      expect(rows[0].count).toBe(1);
      expect(rows[0].avg_ms).toBeCloseTo(80);
      expect(rows[1].count).toBe(2);
      expect(rows[1].avg_ms).toBeCloseTo(2);
      expect(rows[1].total_ms).toBe(4);
    } finally {
      db.close();
    }
  });

  it('--since / --until scope to recordings within the time range', () => {
    const db = freshDb();
    try {
      const oldId = (db
        .prepare(
          `INSERT INTO appmaps (name, source_path, timestamp) VALUES ('old', '/o', '2026-04-01T00:00:00.000Z')`
        )
        .run().lastInsertRowid as number);
      const newId = (db
        .prepare(
          `INSERT INTO appmaps (name, source_path, timestamp) VALUES ('new', '/n', '2026-04-30T00:00:00.000Z')`
        )
        .run().lastInsertRowid as number);
      db.prepare(
        `INSERT INTO sql_queries (appmap_id, event_id, sql_text, elapsed_ms) VALUES (?, 1, 'SELECT a', 1)`
      ).run(oldId);
      db.prepare(
        `INSERT INTO sql_queries (appmap_id, event_id, sql_text, elapsed_ms) VALUES (?, 1, 'SELECT b', 2)`
      ).run(newId);

      const since = sqlHotspots(db, { since: '2026-04-15T00:00:00.000Z' });
      expect(since).toHaveLength(1);
      expect(since[0].sql_text).toBe('SELECT b');

      const until = sqlHotspots(db, { until: '2026-04-15T00:00:00.000Z' });
      expect(until).toHaveLength(1);
      expect(until[0].sql_text).toBe('SELECT a');
    } finally {
      db.close();
    }
  });

  it('--branch filter applies', () => {
    const db = freshDb();
    try {
      seedRecording(db, {
        name: 'a',
        branch: 'main',
        queries: [{ event_id: 1, sql: 'SELECT 1', elapsed_ms: 1 }],
      });
      seedRecording(db, {
        name: 'b',
        branch: 'feature',
        queries: [{ event_id: 1, sql: 'SELECT 2', elapsed_ms: 2 }],
      });
      const main = sqlHotspots(db, { branch: 'main' });
      expect(main).toHaveLength(1);
      expect(main[0].sql_text).toBe('SELECT 1');
    } finally {
      db.close();
    }
  });
});
