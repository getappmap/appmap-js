import sqlite3 from 'better-sqlite3';

import { openQueryDb } from '../../../../../src/cmds/query/db/openQueryDb';
import {
  resolveAppmap,
  tree,
  treeSummary,
  treeWithMeta,
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

describe('tree focus', () => {
  // Build a richer recording: HTTP root → controller → 3 sibling calls
  // (one of which calls a deeper helper) → SQL + EXC under controller.
  function seedRich(db: sqlite3.Database): void {
    const am = db
      .prepare(
        `INSERT INTO appmaps (name, source_path, sql_query_count) VALUES ('rich', '/tmp/rich.appmap.json', 1)`
      )
      .run();
    const id = am.lastInsertRowid;
    db.prepare(
      `INSERT INTO http_requests (appmap_id, event_id, parent_event_id, method, path, status_code, elapsed_ms)
       VALUES (?, 1, NULL, 'POST', '/orders', 500, 520.0)`
    ).run(id);
    db.prepare(
      `INSERT INTO function_calls (appmap_id, event_id, parent_event_id, defined_class, method_id, elapsed_ms)
       VALUES (?, 2, 1, 'OrdersController', 'create', 519.0)`
    ).run(id);
    db.prepare(
      `INSERT OR IGNORE INTO code_objects (fqid, package, classes, leaf_class, method, is_static)
       VALUES ('app/IdempotencyKey.generate', 'app', '["IdempotencyKey"]', 'IdempotencyKey', 'generate', 1)`
    ).run();
    const co = (db
      .prepare(`SELECT id FROM code_objects WHERE fqid = 'app/IdempotencyKey.generate'`)
      .get() as { id: number }).id;
    db.prepare(
      `INSERT INTO function_calls (appmap_id, event_id, parent_event_id, code_object_id, defined_class, method_id, elapsed_ms)
       VALUES (?, 3, 2, ?, 'IdempotencyKey', 'generate', 0.2)`
    ).run(id, co);
    db.prepare(
      `INSERT INTO function_calls (appmap_id, event_id, parent_event_id, defined_class, method_id, elapsed_ms)
       VALUES (?, 4, 2, 'Order', 'new', 0.4)`
    ).run(id);
    db.prepare(
      `INSERT INTO sql_queries (appmap_id, event_id, parent_event_id, sql_text, elapsed_ms)
       VALUES (?, 5, 2, 'INSERT INTO orders (id, name) VALUES (?, ?)', 14.0)`
    ).run(id);
    db.prepare(
      `INSERT INTO exceptions (appmap_id, event_id, parent_event_id, exception_class, message)
       VALUES (?, 2, 1, 'IntegrityError', 'duplicate key')`
    ).run(id);
    // Add an outbound HTTP call as a separate child of controller
    db.prepare(
      `INSERT INTO http_client_requests (appmap_id, event_id, parent_event_id, method, url, status_code, elapsed_ms)
       VALUES (?, 6, 2, 'GET', 'https://api.example/v1', 200, 40.0)`
    ).run(id);
    // A deeper descendant under IdempotencyKey.generate (event_id 3)
    db.prepare(
      `INSERT INTO function_calls (appmap_id, event_id, parent_event_id, defined_class, method_id, elapsed_ms)
       VALUES (?, 7, 3, 'Digest', 'sha256', 0.05)`
    ).run(id);
  }

  it('--focus-sql narrows to the matching SQL plus its ancestors and their children', () => {
    const db = freshDb();
    try {
      seedRich(db);
      const nodes = tree(db, 'rich', { focusSql: 'INSERT INTO orders' });
      const ids = new Set(nodes.map((n) => n.event_id));
      // Includes: HTTP (1), controller (2), SQL (5), and the controller's
      // direct children (3, 4, 5, 6, 7? No — children of controller are
      // 3, 4, 5, 6 only; 7 is a descendant of 3, not a sibling of focus).
      expect(ids.has(1)).toBe(true);
      expect(ids.has(2)).toBe(true);
      expect(ids.has(5)).toBe(true);
      expect(ids.has(3)).toBe(true); // sibling
      expect(ids.has(4)).toBe(true); // sibling
      expect(ids.has(6)).toBe(true); // sibling
      // 7 is a child of 3, not of an ancestor of the focus.
      expect(ids.has(7)).toBe(false);
    } finally {
      db.close();
    }
  });

  it('--focus-fn matches by canonical fqid', () => {
    const db = freshDb();
    try {
      seedRich(db);
      const nodes = tree(db, 'rich', { focusFn: 'app/IdempotencyKey.generate' });
      const ids = new Set(nodes.map((n) => n.event_id));
      // Focus event_id 3; ancestors 2, 1; children of ancestors include
      // siblings 4, 5, 6 (children of 2). Descendants of 3: 7.
      expect(ids.has(1)).toBe(true);
      expect(ids.has(2)).toBe(true);
      expect(ids.has(3)).toBe(true);
      expect(ids.has(4)).toBe(true);
      expect(ids.has(5)).toBe(true);
      expect(ids.has(6)).toBe(true);
      expect(ids.has(7)).toBe(true); // descendant
    } finally {
      db.close();
    }
  });

  it('--focus-route matches a server request', () => {
    const db = freshDb();
    try {
      seedRich(db);
      const nodes = tree(db, 'rich', { focusRoute: '/orders' });
      // The HTTP request matches; ancestors of HTTP = none; descendants
      // of the focus drill down. With descendants=3 we get the full tree
      // up to depth 3 from the request.
      expect(nodes.find((n) => n.kind === 'http_server')).toBeDefined();
      expect(nodes.find((n) => n.kind === 'function' && n.method_id === 'create')).toBeDefined();
    } finally {
      db.close();
    }
  });

  it('--focus-url matches an outbound call', () => {
    const db = freshDb();
    try {
      seedRich(db);
      const nodes = tree(db, 'rich', { focusUrl: 'api.example' });
      const ids = new Set(nodes.map((n) => n.event_id));
      expect(ids.has(6)).toBe(true);
    } finally {
      db.close();
    }
  });

  it('--ancestors=1 trims the path to root', () => {
    const db = freshDb();
    try {
      seedRich(db);
      const nodes = tree(db, 'rich', { focusFn: 'app/IdempotencyKey.generate', ancestors: 1 });
      const ids = new Set(nodes.map((n) => n.event_id));
      // Only controller (1 ancestor) — not HTTP.
      expect(ids.has(2)).toBe(true);
      expect(ids.has(1)).toBe(false);
    } finally {
      db.close();
    }
  });

  it('--descendants=0 drops the subtree below focus', () => {
    const db = freshDb();
    try {
      seedRich(db);
      const nodes = tree(db, 'rich', {
        focusFn: 'app/IdempotencyKey.generate',
        descendants: 0,
      });
      const ids = new Set(nodes.map((n) => n.event_id));
      // 7 (descendant of focus) excluded.
      expect(ids.has(3)).toBe(true);
      expect(ids.has(7)).toBe(false);
    } finally {
      db.close();
    }
  });

  it('--min-elapsed-ms prunes fast subtrees', () => {
    const db = freshDb();
    try {
      seedRich(db);
      const nodes = tree(db, 'rich', { minElapsedMs: 10 });
      const ids = new Set(nodes.map((n) => n.event_id));
      // SQL (14ms) and outbound HTTP (40ms) survive; IdempotencyKey
      // (0.2ms with no fast descendant) and Order.new (0.4ms) are pruned.
      expect(ids.has(5)).toBe(true);
      expect(ids.has(6)).toBe(true);
      expect(ids.has(3)).toBe(false);
      expect(ids.has(4)).toBe(false);
    } finally {
      db.close();
    }
  });

  it('focus with no matches returns no events', () => {
    const db = freshDb();
    try {
      seedRich(db);
      const nodes = tree(db, 'rich', { focusFn: 'app/Nope.nothing' });
      expect(nodes).toEqual([]);
    } finally {
      db.close();
    }
  });

  it('depths are recomputed relative to the highest included ancestor', () => {
    const db = freshDb();
    try {
      seedRich(db);
      // Without focus, HTTP is depth 0, controller 1, IdempotencyKey 2.
      const focused = tree(db, 'rich', { focusFn: 'app/IdempotencyKey.generate', ancestors: 1 });
      // Highest included is controller (event_id=2). It should now be
      // depth 0; its child IdempotencyKey (focus) should be depth 1.
      const controller = focused.find((n) => n.kind === 'function' && n.method_id === 'create');
      const idem = focused.find((n) => n.kind === 'function' && n.method_id === 'generate');
      expect(controller?.depth).toBe(0);
      expect(idem?.depth).toBe(1);
    } finally {
      db.close();
    }
  });

  // --- Spec 04: truncation signal ---------------------------------------

  describe('treeWithMeta truncation', () => {
    it('reports truncated=true and a next_step when descendants budget cuts off children', () => {
      const db = freshDb();
      try {
        seedRich(db);
        // Focus at HTTP root (depth 0). The tree under the focus is
        // controller (1) → idempotencyKey (2) → digest (3). With
        // descendants=1, only the controller is reachable; idem and
        // digest are cut off.
        const result = treeWithMeta(db, 'rich', {
          focusRoute: '/orders',
          descendants: 1,
        });
        expect(result.truncated).toBe(true);
        expect(result.next_step).toMatch(/child_depth=3/);
        expect(result.next_step).toContain("appmap='rich'");
      } finally {
        db.close();
      }
    });

    it('reports truncated=false when every leaf reaches its natural end', () => {
      const db = freshDb();
      try {
        seedRich(db);
        // descendants=10 is well past the deepest leaf (sha256 at 3
        // levels under the focus). Nothing gets cut off.
        const result = treeWithMeta(db, 'rich', {
          focusRoute: '/orders',
          descendants: 10,
        });
        expect(result.truncated).toBe(false);
        expect(result.next_step).toBeUndefined();
        expect(result.max_depth_reached).toBeGreaterThan(0);
      } finally {
        db.close();
      }
    });

    it('reports truncated=false when no focus is active (full recording is returned)', () => {
      const db = freshDb();
      try {
        seedRich(db);
        const result = treeWithMeta(db, 'rich');
        expect(result.truncated).toBe(false);
        expect(result.nodes.length).toBeGreaterThan(0);
      } finally {
        db.close();
      }
    });
  });
});

describe('tree --filter', () => {
  it('returns only http events when filter=http', () => {
    const db = freshDb();
    try {
      seed(db, { addOutbound: true });
      const nodes = tree(db, 'orders_create_42').filter(
        (n) => n.kind === 'http_server' || n.kind === 'http_client'
      );
      expect(nodes.map((n) => n.kind).sort()).toEqual(['http_client', 'http_server']);
    } finally {
      db.close();
    }
  });

  it('returns only sql events when filter=sql', () => {
    const db = freshDb();
    try {
      seed(db);
      const nodes = tree(db, 'orders_create_42').filter((n) => n.kind === 'sql');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].kind).toBe('sql');
    } finally {
      db.close();
    }
  });
});

describe('log nodes in tree', () => {
  function seedWithLogger(db: sqlite3.Database): number {
    const am = db
      .prepare(
        `INSERT INTO appmaps (name, source_path) VALUES ('with_logger', '/tmp/with_logger.appmap.json')`
      )
      .run();
    const id = am.lastInsertRowid;
    db.prepare(
      `INSERT INTO http_requests (appmap_id, event_id, parent_event_id, method, path, status_code, elapsed_ms)
       VALUES (?, 1, NULL, 'POST', '/orders', 500, 100)`
    ).run(id);
    db.prepare(
      `INSERT INTO function_calls (appmap_id, event_id, parent_event_id, defined_class, method_id, elapsed_ms)
       VALUES (?, 2, 1, 'OrdersController', 'create', 90)`
    ).run(id);
    db.prepare(
      `INSERT OR IGNORE INTO code_objects (fqid, package, classes, leaf_class, method, is_static)
       VALUES ('app/AppLogger#error', 'app', '["AppLogger"]', 'AppLogger', 'error', 0)`
    ).run();
    const logCo = (db
      .prepare(`SELECT id FROM code_objects WHERE fqid = 'app/AppLogger#error'`)
      .get() as { id: number }).id;
    db.prepare(`INSERT OR IGNORE INTO labels (code_object_id, label) VALUES (?, 'log')`).run(logCo);
    db.prepare(
      `INSERT INTO function_calls (appmap_id, event_id, parent_event_id, code_object_id,
         defined_class, method_id, elapsed_ms, parameters_json)
       VALUES (?, 3, 2, ?, 'AppLogger', 'error', 0.05, ?)`
    ).run(
      id,
      logCo,
      JSON.stringify([{ name: 'message', class: 'String', value: 'connection refused' }])
    );
    return Number(id);
  }

  it('promotes function calls with the `log` label to a log node kind', () => {
    const db = freshDb();
    try {
      seedWithLogger(db);
      const nodes = tree(db, 'with_logger');
      const log = nodes.find((n) => n.kind === 'log');
      expect(log).toBeDefined();
      if (log?.kind !== 'log') throw new Error('expected log');
      expect(log.logger).toBe('AppLogger');
      expect(log.method_id).toBe('error');
      expect(log.event_id).toBe(3);
      // The same function_call should NOT also appear as a function node.
      expect(nodes.filter((n) => n.event_id === 3 && n.kind === 'function')).toEqual([]);
      // Other function_calls remain function nodes.
      expect(nodes.find((n) => n.kind === 'function' && n.method_id === 'create')).toBeDefined();
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
