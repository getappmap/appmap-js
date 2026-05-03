import sqlite3 from 'better-sqlite3';

import { openQueryDb } from '../../../../../src/cmds/query/db/openQueryDb';
import {
  findAppmaps,
  findCalls,
  findExceptions,
  findLogs,
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
  requests?: {
    event_id: number;
    method: string;
    path: string;
    normalized_path?: string;
    status: number;
    elapsed_ms?: number;
  }[];
  queries?: {
    event_id: number;
    parent_event_id?: number;
    sql: string;
    caller_class?: string;
    caller_method?: string;
    elapsed_ms?: number;
  }[];
  calls?: {
    event_id: number;
    parent_event_id?: number;
    defined_class: string;
    method_id: string;
    elapsed_ms?: number;
    fqid?: string;
    labels?: string[];
    parameters?: { name: string; class?: string; value: unknown }[];
    return_value?: unknown;
  }[];
  exceptions?: {
    event_id: number;
    exception_class: string;
    message?: string;
  }[];
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
    `INSERT INTO sql_queries (appmap_id, event_id, parent_event_id, sql_text,
       caller_class, caller_method, elapsed_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
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
    `INSERT INTO function_calls (appmap_id, event_id, parent_event_id, defined_class, method_id,
       code_object_id, elapsed_ms, parameters_json, return_value)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        q.parent_event_id ?? null,
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
      const paramsJson = c.parameters ? JSON.stringify(c.parameters) : null;
      const returnVal =
        c.return_value === undefined
          ? null
          : typeof c.return_value === 'string'
            ? c.return_value
            : JSON.stringify(c.return_value);
      insCall.run(
        aid,
        c.event_id,
        c.parent_event_id ?? null,
        c.defined_class,
        c.method_id,
        coId,
        c.elapsed_ms ?? null,
        paramsJson,
        returnVal
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

  it('is deterministic when route filtering — picks the lowest event_id matching request', () => {
    const db = freshDb();
    try {
      // Two POST /orders requests in one recording with different elapsed.
      // The query must consistently pick event_id=1 (the smaller).
      seed(db, [
        {
          name: 'a',
          requests: [
            { event_id: 1, method: 'POST', path: '/orders', status: 500, elapsed_ms: 100 },
            { event_id: 2, method: 'POST', path: '/orders', status: 500, elapsed_ms: 999 },
          ],
        },
      ]);
      const rows = findAppmaps(db, { route: 'POST /orders' });
      expect(rows).toHaveLength(1);
      expect(rows[0].elapsed_ms).toBe(100); // event_id=1 wins, not 2
    } finally {
      db.close();
    }
  });

  it('--duration filters on the appmap row (a.elapsed_ms)', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'fast',
          requests: [{ event_id: 1, method: 'GET', path: '/x', status: 200, elapsed_ms: 50 }],
        },
        {
          name: 'slow',
          requests: [{ event_id: 1, method: 'GET', path: '/x', status: 200, elapsed_ms: 5000 }],
        },
      ]);
      const rows = findAppmaps(db, { duration: { op: '>', value: 1000 } });
      expect(rows).toHaveLength(1);
      expect(rows[0].appmap_name).toBe('slow');
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

describe('find filters: --commit, --since/--until, --duration', () => {
  it('--commit on findRequests', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          commit: 'abc123',
          requests: [{ event_id: 1, method: 'GET', path: '/x', status: 200 }],
        },
        {
          name: 'b',
          commit: 'def456',
          requests: [{ event_id: 1, method: 'GET', path: '/y', status: 200 }],
        },
      ]);
      const rows = findRequests(db, { commit: 'abc123' });
      expect(rows).toHaveLength(1);
      expect(rows[0].appmap_name).toBe('a');
    } finally {
      db.close();
    }
  });

  it('--commit on findAppmaps', () => {
    const db = freshDb();
    try {
      seed(db, [
        { name: 'a', commit: 'abc' },
        { name: 'b', commit: 'def' },
      ]);
      expect(findAppmaps(db, { commit: 'abc' })).toHaveLength(1);
    } finally {
      db.close();
    }
  });

  it('--since / --until on findRequests filter via the appmap timestamp', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          timestamp: '2026-04-01T00:00:00.000Z',
          requests: [{ event_id: 1, method: 'GET', path: '/x', status: 200 }],
        },
        {
          name: 'b',
          timestamp: '2026-04-15T00:00:00.000Z',
          requests: [{ event_id: 1, method: 'GET', path: '/x', status: 200 }],
        },
        {
          name: 'c',
          timestamp: '2026-04-30T00:00:00.000Z',
          requests: [{ event_id: 1, method: 'GET', path: '/x', status: 200 }],
        },
      ]);
      const rows = findRequests(db, {
        since: '2026-04-10T00:00:00.000Z',
        until: '2026-04-20T00:00:00.000Z',
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].appmap_name).toBe('b');
    } finally {
      db.close();
    }
  });

  it('--since on findCalls scopes via the recording', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'old',
          timestamp: '2026-04-01T00:00:00.000Z',
          calls: [{ event_id: 1, defined_class: 'X', method_id: 'm' }],
        },
        {
          name: 'new',
          timestamp: '2026-04-30T00:00:00.000Z',
          calls: [{ event_id: 1, defined_class: 'X', method_id: 'm' }],
        },
      ]);
      const rows = findCalls(db, { since: '2026-04-15T00:00:00.000Z' });
      expect(rows).toHaveLength(1);
      expect(rows[0].appmap_name).toBe('new');
    } finally {
      db.close();
    }
  });

  it('--duration on findCalls filters per-row elapsed_ms', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          calls: [
            { event_id: 1, defined_class: 'X', method_id: 'fast', elapsed_ms: 5 },
            { event_id: 2, defined_class: 'X', method_id: 'slow', elapsed_ms: 500 },
          ],
        },
      ]);
      const rows = findCalls(db, { duration: { op: '>', value: 100 } });
      expect(rows).toHaveLength(1);
      expect(rows[0].method_id).toBe('slow');
    } finally {
      db.close();
    }
  });

  it('--duration on findQueries filters per-row elapsed_ms', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          queries: [
            { event_id: 1, sql: 'SELECT 1', elapsed_ms: 1 },
            { event_id: 2, sql: 'SELECT 2', elapsed_ms: 50 },
          ],
        },
      ]);
      const rows = findQueries(db, { duration: { op: '>=', value: 10 } });
      expect(rows).toHaveLength(1);
      expect(rows[0].sql_text).toBe('SELECT 2');
    } finally {
      db.close();
    }
  });

  it('findQueries --class matches via the parent function_call code_object when the linked parent has the right class', () => {
    const db = freshDb();
    try {
      // Seed a function_call with a code_object link, then a sql_query
      // whose parent_event_id references that call. caller_class is set
      // to a deliberately mismatching raw string so we can prove the
      // code_object path (not the fallback) is matching.
      seed(db, [
        {
          name: 'a',
          calls: [
            {
              event_id: 10,
              defined_class: 'org.example.UserRepository',
              method_id: 'findById',
              fqid: 'org/example/UserRepository#findById',
            },
          ],
          queries: [
            {
              event_id: 11,
              parent_event_id: 10,
              sql: 'SELECT 1',
              caller_class: 'WrongClassName',
              caller_method: 'wrong',
            },
          ],
        },
      ]);
      // Class part is read from code_objects (UserRepository), not from
      // the WrongClassName caller_class string.
      expect(findQueries(db, { className: 'UserRepository' })).toHaveLength(1);
      // Full chain match also works.
      expect(findQueries(db, { className: 'org/example/UserRepository' })).toHaveLength(
        1
      );
      // Misspelled — no match.
      expect(findQueries(db, { className: 'OtherRepository' })).toHaveLength(0);
    } finally {
      db.close();
    }
  });

  it('findQueries --class matches caller_class via the suffix-aware helper', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          queries: [
            {
              event_id: 1,
              sql: 'SELECT 1',
              caller_class: 'org.example.UserRepository',
              caller_method: 'findById',
            },
            {
              event_id: 2,
              sql: 'SELECT 2',
              caller_class: 'OpenSSL::Cipher',
              caller_method: 'decrypt',
            },
            {
              event_id: 3,
              sql: 'SELECT 3',
              caller_class: 'Other',
              caller_method: 'm',
            },
          ],
        },
      ]);
      // Java dot-suffix
      expect(findQueries(db, { className: 'UserRepository' })).toHaveLength(1);
      // Ruby ::-suffix
      expect(findQueries(db, { className: 'Cipher' })).toHaveLength(1);
      // Exact match also works
      expect(findQueries(db, { className: 'OpenSSL::Cipher' })).toHaveLength(1);
      // Top-level
      expect(findQueries(db, { className: 'Other' })).toHaveLength(1);
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

describe('findLogs', () => {
  it('returns only label=log calls; non-log calls are excluded', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          calls: [
            {
              event_id: 1,
              defined_class: 'Logger',
              method_id: 'info',
              labels: ['log'],
              parameters: [{ name: 'message', class: 'String', value: 'starting up' }],
            },
            { event_id: 2, defined_class: 'OrdersController', method_id: 'create' },
          ],
        },
      ]);
      const rows = findLogs(db, {});
      expect(rows).toHaveLength(1);
      expect(rows[0].logger).toBe('Logger');
      expect(rows[0].method_id).toBe('info');
    } finally {
      db.close();
    }
  });

  it('--message matches a substring inside parameters_json', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          calls: [
            {
              event_id: 1,
              defined_class: 'Logger',
              method_id: 'error',
              labels: ['log'],
              parameters: [{ name: 'message', class: 'String', value: 'connection refused' }],
            },
            {
              event_id: 2,
              defined_class: 'Logger',
              method_id: 'info',
              labels: ['log'],
              parameters: [{ name: 'message', class: 'String', value: 'started worker' }],
            },
          ],
        },
      ]);
      const rows = findLogs(db, { message: 'refused' });
      expect(rows).toHaveLength(1);
      expect(rows[0].event_id).toBe(1);
    } finally {
      db.close();
    }
  });

  it('--message also matches against return_value (structured-return contract)', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          calls: [
            {
              event_id: 1,
              defined_class: 'Logger',
              method_id: 'info',
              labels: ['log'],
              // No params; the message lives in a structured return_value.
              return_value: { level: 'info', message: 'connection refused at host:5432' },
            },
            {
              event_id: 2,
              defined_class: 'Logger',
              method_id: 'info',
              labels: ['log'],
              return_value: { level: 'info', message: 'all systems nominal' },
            },
          ],
        },
      ]);
      const rows = findLogs(db, { message: 'refused' });
      expect(rows).toHaveLength(1);
      expect(rows[0].event_id).toBe(1);
    } finally {
      db.close();
    }
  });

  it('--logger filters by the logging class (uses classFilterClauses)', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          calls: [
            {
              event_id: 1,
              defined_class: 'app.AppLogger',
              method_id: 'info',
              labels: ['log'],
              parameters: [{ name: 'msg', class: 'String', value: 'hello' }],
            },
            {
              event_id: 2,
              defined_class: 'lib.AuditLogger',
              method_id: 'info',
              labels: ['log'],
              parameters: [{ name: 'msg', class: 'String', value: 'audited' }],
            },
          ],
        },
      ]);
      // Suffix-aware short-form match: "AppLogger" hits "app.AppLogger".
      const rows = findLogs(db, { logger: 'AppLogger' });
      expect(rows).toHaveLength(1);
      expect(rows[0].event_id).toBe(1);
    } finally {
      db.close();
    }
  });

  it('combines --message with appmap-scope filters (--branch)', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          branch: 'main',
          calls: [
            {
              event_id: 1,
              defined_class: 'Logger',
              method_id: 'info',
              labels: ['log'],
              parameters: [{ name: 'message', class: 'String', value: 'connection refused' }],
            },
          ],
        },
        {
          name: 'b',
          branch: 'feature',
          calls: [
            {
              event_id: 1,
              defined_class: 'Logger',
              method_id: 'info',
              labels: ['log'],
              parameters: [{ name: 'message', class: 'String', value: 'connection refused' }],
            },
          ],
        },
      ]);
      const rows = findLogs(db, { message: 'refused', branch: 'feature' });
      expect(rows).toHaveLength(1);
      expect(rows[0].appmap_name).toBe('b');
    } finally {
      db.close();
    }
  });

  it('false positives are accepted: --message matches a parameter name', () => {
    // Documents the design choice — broad LIKE over the JSON blob means
    // a search for "message" matches the parameter name, not just the
    // value. Display-time projection can tighten this if needed.
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          calls: [
            {
              event_id: 1,
              defined_class: 'Logger',
              method_id: 'info',
              labels: ['log'],
              parameters: [{ name: 'message', class: 'String', value: 'hi' }],
            },
          ],
        },
      ]);
      const rows = findLogs(db, { message: 'message' });
      expect(rows).toHaveLength(1);
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

  it('--with-logs attaches the last N preceding logs in chronological order', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          calls: [
            {
              event_id: 1,
              defined_class: 'Logger',
              method_id: 'info',
              labels: ['log'],
              parameters: [{ name: 'message', class: 'String', value: 'starting up' }],
            },
            {
              event_id: 2,
              defined_class: 'Logger',
              method_id: 'warn',
              labels: ['log'],
              parameters: [{ name: 'message', class: 'String', value: 'connection slow' }],
            },
            {
              event_id: 3,
              defined_class: 'Logger',
              method_id: 'error',
              labels: ['log'],
              parameters: [{ name: 'message', class: 'String', value: 'connection refused' }],
            },
          ],
          // Exception lands at event 4, after the three logs.
          exceptions: [{ event_id: 4, exception_class: 'IOError', message: 'broken pipe' }],
        },
      ]);
      const rows = findExceptions(db, { withLogs: 2 });
      expect(rows).toHaveLength(1);
      expect(rows[0].recent_logs).toBeDefined();
      // Last 2 in chronological order: the warn at event 2, then error at event 3.
      const logs = rows[0].recent_logs!;
      expect(logs).toHaveLength(2);
      expect(logs[0].event_id).toBe(2);
      expect(logs[1].event_id).toBe(3);
    } finally {
      db.close();
    }
  });

  it('--with-logs is omitted when not requested (recent_logs undefined)', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          calls: [
            {
              event_id: 1,
              defined_class: 'Logger',
              method_id: 'info',
              labels: ['log'],
              parameters: [{ name: 'message', class: 'String', value: 'hi' }],
            },
          ],
          exceptions: [{ event_id: 2, exception_class: 'IOError' }],
        },
      ]);
      const rows = findExceptions(db, {});
      expect(rows[0].recent_logs).toBeUndefined();
    } finally {
      db.close();
    }
  });

  it('--with-logs with no preceding logs returns an empty array', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          // Exception at event 1; no logs at all.
          exceptions: [{ event_id: 1, exception_class: 'IOError' }],
        },
      ]);
      const rows = findExceptions(db, { withLogs: 5 });
      expect(rows[0].recent_logs).toEqual([]);
    } finally {
      db.close();
    }
  });

  it('--with-logs only includes logs from the same recording', () => {
    const db = freshDb();
    try {
      seed(db, [
        {
          name: 'a',
          calls: [
            {
              event_id: 1,
              defined_class: 'Logger',
              method_id: 'info',
              labels: ['log'],
              parameters: [{ name: 'message', class: 'String', value: 'recording-a log' }],
            },
          ],
          exceptions: [{ event_id: 2, exception_class: 'IOError' }],
        },
        {
          name: 'b',
          calls: [
            {
              event_id: 1,
              defined_class: 'Logger',
              method_id: 'info',
              labels: ['log'],
              parameters: [{ name: 'message', class: 'String', value: 'recording-b log' }],
            },
          ],
          exceptions: [{ event_id: 2, exception_class: 'IOError' }],
        },
      ]);
      const rows = findExceptions(db, { withLogs: 5 });
      expect(rows).toHaveLength(2);
      // Each exception's recent_logs is scoped to its own recording.
      for (const row of rows) {
        expect(row.recent_logs).toHaveLength(1);
        expect(row.recent_logs![0].appmap_name).toBe(row.appmap_name);
      }
    } finally {
      db.close();
    }
  });
});
