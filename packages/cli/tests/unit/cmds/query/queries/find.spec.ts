import sqlite3 from 'better-sqlite3';

import { openQueryDb } from '../../../../../src/cmds/query/db/openQueryDb';
import {
  findAppmaps,
  findCalls,
  findExceptions,
  findQueries,
  findRequests,
} from '../../../../../src/cmds/query/queries/find';

function freshDb(): sqlite3.Database {
  return openQueryDb('/tmp/ignored', ':memory:').db;
}

interface Recording {
  name: string;
  branch?: string;
  commit?: string;
  timestamp?: string;
  requests?: Array<{
    event_id: number;
    method: string;
    path: string;
    normalized_path?: string;
    status: number;
    elapsed_ms?: number;
  }>;
  queries?: Array<{
    event_id: number;
    sql: string;
    caller_class?: string;
    caller_method?: string;
    elapsed_ms?: number;
  }>;
  calls?: Array<{
    event_id: number;
    defined_class: string;
    method_id: string;
    elapsed_ms?: number;
    fqid?: string;
    labels?: string[];
  }>;
  exceptions?: Array<{
    event_id: number;
    exception_class: string;
    message?: string;
  }>;
}

function seed(db: sqlite3.Database, recs: Recording[]): void {
  const insAm = db.prepare(
    `INSERT INTO appmaps (name, source_path, git_branch, git_commit, timestamp, sql_query_count, elapsed_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insReq = db.prepare(
    `INSERT INTO http_requests (appmap_id, event_id, method, path, normalized_path, status_code, elapsed_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insQ = db.prepare(
    `INSERT INTO sql_queries (appmap_id, event_id, sql_text, caller_class, caller_method, elapsed_ms)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  // Test seed: derive package + class chain from defined_class so call
  // sites don't have to specify them. defined_class may be Java dot-form
  // ("org.example.Foo"), in which case we treat the trailing segment as
  // the leaf class and the rest as a slash-form package.
  const insCo = db.prepare(
    `INSERT OR IGNORE INTO code_objects (fqid, package, classes, leaf_class, method, is_static)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const selCoId = db.prepare(`SELECT id FROM code_objects WHERE fqid = ?`);
  const insLabel = db.prepare(
    `INSERT OR IGNORE INTO labels (code_object_id, label) VALUES (?, ?)`
  );
  const insCall = db.prepare(
    `INSERT INTO function_calls (appmap_id, event_id, defined_class, method_id, code_object_id, elapsed_ms)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insExc = db.prepare(
    `INSERT INTO exceptions (appmap_id, event_id, exception_class, message)
     VALUES (?, ?, ?, ?)`
  );

  for (const r of recs) {
    const sqlCount = r.queries?.length ?? 0;
    const am = insAm.run(
      r.name,
      `/tmp/${r.name}.appmap.json`,
      r.branch ?? null,
      r.commit ?? null,
      r.timestamp ?? '2026-04-29T12:00:00.000Z',
      sqlCount,
      r.requests?.[0]?.elapsed_ms ?? null
    );
    const aid = am.lastInsertRowid;
    for (const req of r.requests ?? []) {
      insReq.run(
        aid,
        req.event_id,
        req.method,
        req.path,
        req.normalized_path ?? null,
        req.status,
        req.elapsed_ms ?? null
      );
    }
    for (const q of r.queries ?? []) {
      insQ.run(
        aid,
        q.event_id,
        q.sql,
        q.caller_class ?? null,
        q.caller_method ?? null,
        q.elapsed_ms ?? null
      );
    }
    for (const c of r.calls ?? []) {
      const fqid = c.fqid ?? `${c.defined_class}#${c.method_id}`;
      const dotIdx = c.defined_class.lastIndexOf('.');
      const pkg = dotIdx >= 0 ? c.defined_class.slice(0, dotIdx).replace(/\./g, '/') : '';
      const leaf = dotIdx >= 0 ? c.defined_class.slice(dotIdx + 1) : c.defined_class;
      insCo.run(fqid, pkg, JSON.stringify([leaf]), leaf, c.method_id, 0);
      const coId = (selCoId.get(fqid) as { id: number }).id;
      for (const label of c.labels ?? []) insLabel.run(coId, label);
      insCall.run(
        aid,
        c.event_id,
        c.defined_class,
        c.method_id,
        coId,
        c.elapsed_ms ?? null
      );
    }
    for (const e of r.exceptions ?? []) {
      insExc.run(aid, e.event_id, e.exception_class, e.message ?? null);
    }
  }
}

describe('findRequests', () => {
  it('filters by route, method, status, duration, branch', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          branch: 'main',
          requests: [
            { event_id: 1, method: 'GET', path: '/orders/42', normalized_path: '/orders/:id', status: 200, elapsed_ms: 50 },
            { event_id: 2, method: 'POST', path: '/orders', status: 500, elapsed_ms: 520 },
          ],
        },
        {
          name: 'b',
          branch: 'feature',
          requests: [{ event_id: 1, method: 'POST', path: '/orders', status: 500, elapsed_ms: 600 }],
        },
      ]);

      // Method-prefixed route
      const r1 = findRequests(db, { route: 'POST /orders' });
      expect(r1).toHaveLength(2);
      expect(r1.every((r) => r.method === 'POST' && r.route === '/orders')).toBe(true);

      // Status filter
      const r2 = findRequests(db, { status: { op: '>=', value: 500 } });
      expect(r2).toHaveLength(2);

      // Duration filter
      const r3 = findRequests(db, { duration: { op: '>', value: 550 } });
      expect(r3).toHaveLength(1);
      expect(r3[0].appmap_name).toBe('b');

      // Branch filter
      const r4 = findRequests(db, { branch: 'feature' });
      expect(r4).toHaveLength(1);
      expect(r4[0].appmap_name).toBe('b');
    } finally {
      db.close();
    }
  });

  it('--limit/--offset trims results', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          requests: [
            { event_id: 1, method: 'GET', path: '/x', status: 200 },
            { event_id: 2, method: 'GET', path: '/x', status: 200 },
            { event_id: 3, method: 'GET', path: '/x', status: 200 },
          ],
        },
      ]);
      expect(findRequests(db, { limit: 2 })).toHaveLength(2);
      expect(findRequests(db, { limit: 2, offset: 1 })[0].event_id).toBe(2);
    } finally {
      db.close();
    }
  });
});

describe('findAppmaps', () => {
  it('returns one row per recording, sample request fields populated', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          branch: 'main',
          requests: [
            { event_id: 1, method: 'GET', path: '/x', status: 200, elapsed_ms: 100 },
            { event_id: 2, method: 'POST', path: '/y', status: 500, elapsed_ms: 200 },
          ],
        },
        { name: 'b', branch: 'feature' },
      ]);
      const rows = findAppmaps(db, {});
      expect(rows).toHaveLength(2);
      const a = rows.find((r) => r.appmap_name === 'a')!;
      expect(a.route).toBe('/x'); // first request by event_id
      expect(a.branch).toBe('main');
      expect(rows.find((r) => r.appmap_name === 'b')?.route).toBeNull();
    } finally {
      db.close();
    }
  });

  it('--route narrows to recordings with a matching request and reports that request', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          requests: [
            { event_id: 1, method: 'GET', path: '/x', status: 200 },
            { event_id: 2, method: 'POST', path: '/orders', status: 500, elapsed_ms: 520 },
          ],
        },
        { name: 'b', requests: [{ event_id: 1, method: 'GET', path: '/x', status: 200 }] },
      ]);
      const rows = findAppmaps(db, { route: 'POST /orders', status: { op: '>=', value: 500 } });
      expect(rows).toHaveLength(1);
      expect(rows[0].appmap_name).toBe('a');
      expect(rows[0].route).toBe('/orders');
      expect(rows[0].status_code).toBe(500);
      expect(rows[0].elapsed_ms).toBe(520);
    } finally {
      db.close();
    }
  });
});

describe('findQueries', () => {
  it('--table filters via SQL text LIKE; --status scopes via owning request', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          requests: [{ event_id: 1, method: 'POST', path: '/orders', status: 500 }],
          queries: [
            { event_id: 2, sql: 'INSERT INTO orders (...) VALUES (...)', elapsed_ms: 14 },
            { event_id: 3, sql: 'SELECT * FROM users WHERE id = ?' },
          ],
        },
        {
          name: 'b',
          requests: [{ event_id: 1, method: 'GET', path: '/x', status: 200 }],
          queries: [{ event_id: 2, sql: 'INSERT INTO orders (...) VALUES (...)' }],
        },
      ]);
      const rows = findQueries(db, { table: 'orders', status: { op: '>=', value: 500 } });
      expect(rows).toHaveLength(1);
      expect(rows[0].appmap_name).toBe('a');
      expect(rows[0].sql_text).toContain('INSERT INTO orders');
    } finally {
      db.close();
    }
  });
});

describe('findCalls', () => {
  it('--class and --method filter directly; --route scopes by recording', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          requests: [{ event_id: 1, method: 'POST', path: '/orders', status: 500 }],
          calls: [
            { event_id: 2, defined_class: 'IdempotencyKey', method_id: 'generate', fqid: 'app/IdempotencyKey.generate' },
            { event_id: 3, defined_class: 'OrdersController', method_id: 'create' },
          ],
        },
        {
          name: 'b',
          requests: [{ event_id: 1, method: 'GET', path: '/x', status: 200 }],
          calls: [{ event_id: 2, defined_class: 'IdempotencyKey', method_id: 'generate' }],
        },
      ]);
      const rows = findCalls(db, {
        className: 'IdempotencyKey',
        route: 'POST /orders',
        status: { op: '>=', value: 500 },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].appmap_name).toBe('a');
      expect(rows[0].fqid).toBe('app/IdempotencyKey.generate');
    } finally {
      db.close();
    }
  });

  it('--label filters via the labels table', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          calls: [
            { event_id: 1, defined_class: 'Logger', method_id: 'error', labels: ['log'] },
            { event_id: 2, defined_class: 'OrdersController', method_id: 'create' },
          ],
        },
      ]);
      const rows = findCalls(db, { label: 'log' });
      expect(rows).toHaveLength(1);
      expect(rows[0].defined_class).toBe('Logger');
    } finally {
      db.close();
    }
  });
});

describe('findCalls --class / --method (fqid-aware)', () => {
  it('matches the canonical fqid prefix', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          calls: [
            {
              event_id: 1,
              defined_class: 'org.example.UserRepository',
              method_id: 'findById',
              fqid: 'org/example/UserRepository#findById',
            },
          ],
        },
      ]);
      // Canonical V3 fqid prefix (slash form, sans method)
      const rows = findCalls(db, { className: 'org/example/UserRepository' });
      expect(rows).toHaveLength(1);
    } finally {
      db.close();
    }
  });

  it('matches a short class name as the trailing fqid segment', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          calls: [
            {
              event_id: 1,
              defined_class: 'org.example.UserRepository',
              method_id: 'findById',
              fqid: 'org/example/UserRepository#findById',
            },
            {
              event_id: 2,
              defined_class: 'org.other.OrdersController',
              method_id: 'create',
              fqid: 'org/other/OrdersController#create',
            },
          ],
        },
      ]);
      const rows = findCalls(db, { className: 'UserRepository' });
      expect(rows).toHaveLength(1);
      expect(rows[0].method_id).toBe('findById');
    } finally {
      db.close();
    }
  });

  it('matches the trailing dot-segment of a Java-style defined_class even without code_object', () => {
    const db = freshDb();
    try {
      // Insert a function_call that has NO code_object (code_object_id NULL)
      // but has a Java dot-form defined_class.
      const am = db
        .prepare(`INSERT INTO appmaps (name, source_path) VALUES ('a', '/tmp/a.appmap.json')`)
        .run();
      db.prepare(
        `INSERT INTO function_calls (appmap_id, event_id, defined_class, method_id)
         VALUES (?, 1, 'org.example.UserRepository', 'findById')`
      ).run(am.lastInsertRowid);

      const rows = findCalls(db, { className: 'UserRepository' });
      expect(rows).toHaveLength(1);
    } finally {
      db.close();
    }
  });

  it('--method matches via fqid suffix', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          calls: [
            {
              event_id: 1,
              defined_class: 'org.example.UserRepository',
              method_id: 'findById',
              fqid: 'org/example/UserRepository#findById',
            },
            {
              event_id: 2,
              defined_class: 'org.example.OrderRepository',
              method_id: 'findById',
              fqid: 'org/example/OrderRepository#findById',
            },
            {
              event_id: 3,
              defined_class: 'org.example.UserRepository',
              method_id: 'save',
              fqid: 'org/example/UserRepository#save',
            },
          ],
        },
      ]);
      const rows = findCalls(db, { method: 'findById' });
      expect(rows).toHaveLength(2);
      expect(rows.every((r) => r.method_id === 'findById')).toBe(true);
    } finally {
      db.close();
    }
  });
});

describe('findExceptions', () => {
  it('--exception filters by class; --route scopes by recording', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          requests: [{ event_id: 1, method: 'POST', path: '/orders', status: 500 }],
          exceptions: [{ event_id: 2, exception_class: 'IntegrityError', message: 'duplicate key' }],
        },
        {
          name: 'b',
          requests: [{ event_id: 1, method: 'GET', path: '/x', status: 404 }],
          exceptions: [{ event_id: 2, exception_class: 'RecordNotFound' }],
        },
      ]);
      expect(findExceptions(db, { exception: 'IntegrityError' })).toHaveLength(1);
      expect(findExceptions(db, { route: 'POST /orders' })).toHaveLength(1);
      expect(findExceptions(db, { route: 'POST /orders' })[0].appmap_name).toBe('a');
    } finally {
      db.close();
    }
  });
});
