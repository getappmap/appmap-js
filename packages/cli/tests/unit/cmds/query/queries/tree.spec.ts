import sqlite3 from 'better-sqlite3';

import { openQueryDb } from '../../../../../src/cmds/query/db/openQueryDb';
import {
  resolveAppmap,
  tree,
  treeSummary,
} from '../../../../../src/cmds/query/queries/tree';

function freshDb(): sqlite3.Database {
  return openQueryDb('/tmp/ignored', ':memory:').db;
}

// Seed a recording shaped like the V3 worked-session example: an HTTP request
// at depth 0, a controller call beneath it, an SQL query beneath the
// controller, and an exception on the same call.
function seed(
  db: sqlite3.Database,
  opts: {
    name?: string;
    branch?: string;
    addLabel?: boolean;
    addOutbound?: boolean;
  } = {}
): number {
  const am = db
    .prepare(
      `INSERT INTO appmaps (name, source_path, git_branch, sql_query_count)
       VALUES (?, ?, ?, ?)`
    )
    .run(
      opts.name ?? 'orders_create_42',
      `/tmp/${opts.name ?? 'orders_create_42'}.appmap.json`,
      opts.branch ?? 'main',
      1
    );
  const id = am.lastInsertRowid;

  // event_id 1: HTTP server request, parent_event_id null (root)
  db.prepare(
    `INSERT INTO http_requests (appmap_id, event_id, parent_event_id, thread_id,
       method, path, status_code, elapsed_ms)
     VALUES (?, 1, NULL, 1, 'POST', '/orders', 500, 520.0)`
  ).run(id);

  // event_id 2: controller call, parent = 1
  let coId = 1;
  db.prepare(
    `INSERT OR IGNORE INTO code_objects (fqid, package, classes, leaf_class, method, is_static)
     VALUES ('app/OrdersController#create', 'app', '["OrdersController"]', 'OrdersController', 'create', 0)`
  ).run();
  coId = (db
    .prepare(`SELECT id FROM code_objects WHERE fqid = 'app/OrdersController#create'`)
    .get() as { id: number }).id;

  if (opts.addLabel) {
    db.prepare(`INSERT OR IGNORE INTO labels (code_object_id, label) VALUES (?, 'log')`).run(coId);
  }

  db.prepare(
    `INSERT INTO function_calls (appmap_id, event_id, parent_event_id, thread_id,
       code_object_id, defined_class, method_id, elapsed_ms)
     VALUES (?, 2, 1, 1, ?, 'OrdersController', 'create', 519.0)`
  ).run(id, coId);

  // event_id 3: sql_query, parent = 2
  db.prepare(
    `INSERT INTO sql_queries (appmap_id, event_id, parent_event_id, thread_id,
       sql_text, database_type, elapsed_ms)
     VALUES (?, 3, 2, 1, 'INSERT INTO orders (...)', 'postgres', 14.0)`
  ).run(id);

  // event_id 4: exception, owned by call 2 (carried by its return event)
  db.prepare(
    `INSERT INTO exceptions (appmap_id, event_id, parent_event_id, thread_id,
       exception_class, message, path, lineno)
     VALUES (?, 2, 1, 1, 'IntegrityError', 'duplicate key',
             'app/models/order.rb', 42)`
  ).run(id);

  if (opts.addOutbound) {
    db.prepare(
      `INSERT INTO http_client_requests (appmap_id, event_id, parent_event_id, thread_id,
         method, url, status_code, elapsed_ms)
       VALUES (?, 5, 2, 1, 'GET', 'https://api.example/v1', 200, 40.0)`
    ).run(id);
  }

  return Number(id);
}

describe('resolveAppmap', () => {
  it('resolves by exact name match', () => {
    const db = freshDb();
    try {
      seed(db);
      expect(resolveAppmap(db, 'orders_create_42').name).toBe('orders_create_42');
    } finally {
      db.close();
    }
  });

  it('resolves by source-path basename', () => {
    const db = freshDb();
    try {
      // Insert an appmap whose name doesn't match the basename.
      db.prepare(
        `INSERT INTO appmaps (name, source_path) VALUES ('Friendly Name', '/x/foo.appmap.json')`
      ).run();
      expect(resolveAppmap(db, 'foo').source_path).toBe('/x/foo.appmap.json');
    } finally {
      db.close();
    }
  });

  it('throws on miss', () => {
    const db = freshDb();
    try {
      expect(() => resolveAppmap(db, 'nope')).toThrow(/not found/);
    } finally {
      db.close();
    }
  });

  it('throws on ambiguous match', () => {
    const db = freshDb();
    try {
      seed(db, { name: 'a' });
      db.prepare(
        `INSERT INTO appmaps (name, source_path) VALUES ('a', '/y/a.appmap.json')`
      ).run();
      expect(() => resolveAppmap(db, 'a')).toThrow(/ambiguous/);
    } finally {
      db.close();
    }
  });
});

describe('tree', () => {
  it('returns nodes in event_id order with computed depths', () => {
    const db = freshDb();
    try {
      seed(db);
      const nodes = tree(db, 'orders_create_42');

      expect(nodes.map((n) => n.event_id)).toEqual([1, 2, 2, 3]);
      // event 1: HTTP server (root).
      expect(nodes[0].kind).toBe('http_server');
      expect(nodes[0].depth).toBe(0);
      // event 2: function call (under request).
      const fn = nodes.find((n) => n.kind === 'function')!;
      expect(fn.depth).toBe(1);
      // event 2 also has an exception attached (same event_id, separate row).
      const exc = nodes.find((n) => n.kind === 'exception')!;
      expect(exc.depth).toBe(1);
      // event 3: SQL under the function call.
      const sql = nodes.find((n) => n.kind === 'sql')!;
      expect(sql.depth).toBe(2);
    } finally {
      db.close();
    }
  });

  it('exception nodes carry path and lineno', () => {
    const db = freshDb();
    try {
      seed(db);
      const exc = tree(db, 'orders_create_42').find((n) => n.kind === 'exception');
      expect(exc).toBeDefined();
      if (exc?.kind === 'exception') {
        expect(exc.path).toBe('app/models/order.rb');
        expect(exc.lineno).toBe(42);
      }
    } finally {
      db.close();
    }
  });

  it('joins fqid into function nodes', () => {
    const db = freshDb();
    try {
      seed(db);
      const nodes = tree(db, 'orders_create_42');
      const fn = nodes.find((n) => n.kind === 'function')!;
      // @ts-expect-error narrowing not visible here without further check
      expect(fn.fqid).toBe('app/OrdersController#create');
    } finally {
      db.close();
    }
  });
});

describe('treeSummary', () => {
  it('counts SQL, surfaces entry/exception, and tallies labels', () => {
    const db = freshDb();
    try {
      seed(db, { addLabel: true, addOutbound: true });
      const s = treeSummary(db, 'orders_create_42');
      expect(s.entry?.method).toBe('POST');
      expect(s.entry?.route).toBe('/orders');
      expect(s.entry?.status_code).toBe(500);
      expect(s.sql.count).toBe(1);
      expect(s.sql.total_ms).toBeCloseTo(14);
      expect(s.http_client.count).toBe(1);
      expect(s.http_client.total_ms).toBeCloseTo(40);
      expect(s.exceptions[0].exception_class).toBe('IntegrityError');
      expect(s.labels).toEqual([{ label: 'log', count: 1 }]);
    } finally {
      db.close();
    }
  });
});
