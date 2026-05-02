import sqlite3 from 'better-sqlite3';

import { openQueryDb } from '../../../../../src/cmds/query/db/openQueryDb';
import {
  extractTables,
  related,
} from '../../../../../src/cmds/query/queries/related';

function freshDb(): sqlite3.Database {
  return openQueryDb('/tmp/ignored', ':memory:').db;
}

interface SeedRecording {
  name: string;
  branch?: string;
  request?: { method: string; path: string; status: number; elapsed_ms?: number };
  sqls?: string[];
  classes?: string[]; // leaf names; we register code_objects for each
}

function seed(db: sqlite3.Database, recs: SeedRecording[]): void {
  const insAm = db.prepare(
    `INSERT INTO appmaps (name, source_path, git_branch, elapsed_ms) VALUES (?, ?, ?, ?)`
  );
  const insReq = db.prepare(
    `INSERT INTO http_requests (appmap_id, event_id, method, path, status_code, elapsed_ms)
     VALUES (?, 1, ?, ?, ?, ?)`
  );
  const insQ = db.prepare(
    `INSERT INTO sql_queries (appmap_id, event_id, sql_text) VALUES (?, ?, ?)`
  );
  const insCo = db.prepare(
    `INSERT OR IGNORE INTO code_objects (fqid, package, classes, leaf_class, method, is_static)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const selCo = db.prepare(`SELECT id FROM code_objects WHERE fqid = ?`);
  const insCall = db.prepare(
    `INSERT INTO function_calls (appmap_id, event_id, defined_class, method_id, code_object_id)
     VALUES (?, ?, ?, ?, ?)`
  );

  let nextEvent = 100;
  for (const r of recs) {
    const am = insAm.run(
      r.name,
      `/tmp/${r.name}.appmap.json`,
      r.branch ?? null,
      r.request?.elapsed_ms ?? null
    );
    const aid = Number(am.lastInsertRowid);
    if (r.request) {
      insReq.run(
        aid,
        r.request.method,
        r.request.path,
        r.request.status,
        r.request.elapsed_ms ?? null
      );
    }
    for (const sql of r.sqls ?? []) {
      insQ.run(aid, nextEvent++, sql);
    }
    for (const cls of r.classes ?? []) {
      const fqid = `app/${cls}#m`;
      insCo.run(fqid, 'app', JSON.stringify([cls]), cls, 'm', 0);
      const co = selCo.get(fqid) as { id: number };
      insCall.run(aid, nextEvent++, cls, 'm', co.id);
    }
  }
}

describe('extractTables', () => {
  it('extracts FROM/JOIN/INTO/UPDATE table names case-insensitively', () => {
    const sql =
      "SELECT * FROM users u JOIN orders o ON u.id = o.user_id WHERE u.id = 1; INSERT INTO logs VALUES (1); UPDATE Sessions SET x=1";
    expect([...extractTables(sql)].sort()).toEqual(['logs', 'orders', 'sessions', 'users']);
  });

  it('strips a single leading schema qualifier', () => {
    expect(extractTables('SELECT * FROM public.orders')).toEqual(new Set(['orders']));
  });
});

describe('related', () => {
  it('scores by route + tables + classes; excludes the source', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'source',
          request: { method: 'POST', path: '/orders', status: 500 },
          sqls: ['INSERT INTO orders VALUES (1)', 'SELECT * FROM users WHERE id = 1'],
          classes: ['OrdersController', 'IdempotencyKey'],
        },
        {
          name: 'best',
          request: { method: 'POST', path: '/orders', status: 201, elapsed_ms: 140 },
          sqls: ['INSERT INTO orders VALUES (1)', 'SELECT * FROM users WHERE id = 1'],
          classes: ['OrdersController', 'IdempotencyKey'],
        },
        {
          name: 'partial',
          request: { method: 'POST', path: '/orders', status: 201 },
          sqls: ['INSERT INTO orders VALUES (1)'],
          classes: ['OrdersController'],
        },
        {
          name: 'unrelated',
          request: { method: 'GET', path: '/healthz', status: 200 },
          sqls: [],
          classes: ['HealthController'],
        },
      ]);
      const rows = related(db, 'source');
      expect(rows.find((r) => r.appmap_name === 'source')).toBeUndefined();
      expect(rows.find((r) => r.appmap_name === 'unrelated')).toBeUndefined();
      const best = rows.find((r) => r.appmap_name === 'best')!;
      const partial = rows.find((r) => r.appmap_name === 'partial')!;
      // best: route(5) + 2 tables*3 + 2 classes*2 = 15
      expect(best.score).toBe(15);
      expect(best.shared).toContain('route');
      expect(best.shared).toContain('orders');
      expect(best.shared).toContain('users');
      expect(best.shared).toContain('OrdersController');
      // partial: route(5) + 1 table*3 + 1 class*2 = 10
      expect(partial.score).toBe(10);
      // best ranks first
      expect(rows[0].appmap_name).toBe('best');
    } finally {
      db.close();
    }
  });

  it('--branch scopes the candidate pool', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'src',
          branch: 'main',
          request: { method: 'GET', path: '/x', status: 200 },
          classes: ['Foo'],
        },
        {
          name: 'main_match',
          branch: 'main',
          request: { method: 'GET', path: '/x', status: 200 },
          classes: ['Foo'],
        },
        {
          name: 'feature_match',
          branch: 'feature',
          request: { method: 'GET', path: '/x', status: 200 },
          classes: ['Foo'],
        },
      ]);
      const rows = related(db, 'src', { branch: 'main' });
      expect(rows.map((r) => r.appmap_name)).toEqual(['main_match']);
    } finally {
      db.close();
    }
  });

  it('--status filters candidates to recordings with a matching response', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'src',
          request: { method: 'POST', path: '/orders', status: 500 },
          classes: ['Foo'],
        },
        {
          name: 'succeeded',
          request: { method: 'POST', path: '/orders', status: 201 },
          classes: ['Foo'],
        },
        {
          name: 'also_failed',
          request: { method: 'POST', path: '/orders', status: 500 },
          classes: ['Foo'],
        },
      ]);
      const rows = related(db, 'src', { status: { op: '<', value: 400 } });
      expect(rows.map((r) => r.appmap_name)).toEqual(['succeeded']);
    } finally {
      db.close();
    }
  });

  it('--limit caps the result set', () => {
    const db = freshDb();
    try {
      seed(db, [
        { name: 'src', request: { method: 'GET', path: '/x', status: 200 }, classes: ['A', 'B'] },
        { name: 'a', request: { method: 'GET', path: '/x', status: 200 }, classes: ['A', 'B'] },
        { name: 'b', request: { method: 'GET', path: '/x', status: 200 }, classes: ['A'] },
        { name: 'c', request: { method: 'GET', path: '/x', status: 200 }, classes: ['B'] },
      ]);
      expect(related(db, 'src', { limit: 2 })).toHaveLength(2);
    } finally {
      db.close();
    }
  });
});
