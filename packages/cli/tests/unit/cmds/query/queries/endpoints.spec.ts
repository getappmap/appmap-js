import sqlite3 from 'better-sqlite3';

import { openQueryDb } from '../../../../../src/cmds/query/db/openQueryDb';
import { endpoints } from '../../../../../src/cmds/query/queries/endpoints';

function freshDb(): sqlite3.Database {
  return openQueryDb('/tmp/ignored', ':memory:').db;
}

interface SeedReq {
  method: string;
  path: string;
  normalized_path?: string;
  status: number;
  elapsed_ms: number | null;
  timestamp?: string;
  branch?: string;
}

let nextEvent = 1;
function seed(db: sqlite3.Database, reqs: SeedReq[]): void {
  const insertAppmap = db.prepare(
    `INSERT INTO appmaps (name, source_path, git_branch, timestamp) VALUES (?, ?, ?, ?)`
  );
  const insertReq = db.prepare(
    `INSERT INTO http_requests (appmap_id, event_id, method, path, normalized_path,
       status_code, elapsed_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (let i = 0; i < reqs.length; i++) {
    const r = reqs[i];
    const ts = r.timestamp ?? '2026-04-29T12:00:00.000Z';
    const am = insertAppmap.run(
      `rec-${i}`,
      `/tmp/rec-${i}.appmap.json`,
      r.branch ?? null,
      ts
    );
    insertReq.run(
      am.lastInsertRowid,
      nextEvent++,
      r.method,
      r.path,
      r.normalized_path ?? null,
      r.status,
      r.elapsed_ms
    );
  }
}

describe('endpoints', () => {
  beforeEach(() => {
    nextEvent = 1;
  });

  it('returns an empty array when there are no requests', () => {
    const db = freshDb();
    try {
      expect(endpoints(db).rows).toEqual([]);
    } finally {
      db.close();
    }
  });

  it('groups by (method, route) and counts', () => {
    const db = freshDb();
    try {
      seed(db, [
        { method: 'GET', path: '/x', status: 200, elapsed_ms: 100 },
        { method: 'GET', path: '/x', status: 200, elapsed_ms: 200 },
        { method: 'POST', path: '/x', status: 201, elapsed_ms: 150 },
      ]);
      const out = endpoints(db).rows;
      const get = out.find((r) => r.method === 'GET');
      const post = out.find((r) => r.method === 'POST');
      expect(get?.count).toBe(2);
      expect(post?.count).toBe(1);
      expect(out).toHaveLength(2);
    } finally {
      db.close();
    }
  });

  it('uses normalized_path when present, otherwise raw path', () => {
    const db = freshDb();
    try {
      seed(db, [
        { method: 'GET', path: '/orders/42', normalized_path: '/orders/:id', status: 200, elapsed_ms: 100 },
        { method: 'GET', path: '/orders/99', normalized_path: '/orders/:id', status: 200, elapsed_ms: 200 },
        { method: 'GET', path: '/raw-only', status: 200, elapsed_ms: 50 },
      ]);
      const out = endpoints(db).rows;
      expect(out.find((r) => r.route === '/orders/:id')?.count).toBe(2);
      expect(out.find((r) => r.route === '/raw-only')?.count).toBe(1);
    } finally {
      db.close();
    }
  });

  it('computes avg, p95, and err_pct', () => {
    const db = freshDb();
    try {
      // 10 requests on /x: 9 with status 200 / elapsed [10,20,...,90], 1 with status 500 / elapsed 1000.
      const reqs: SeedReq[] = [];
      for (let i = 1; i <= 9; i++) {
        reqs.push({ method: 'GET', path: '/x', status: 200, elapsed_ms: i * 10 });
      }
      reqs.push({ method: 'GET', path: '/x', status: 500, elapsed_ms: 1000 });
      seed(db, reqs);

      const row = endpoints(db).rows.find((r) => r.route === '/x')!;
      expect(row.count).toBe(10);
      expect(row.err_pct).toBeCloseTo(10);
      expect(row.avg_ms).toBeCloseTo((10 + 20 + 30 + 40 + 50 + 60 + 70 + 80 + 90 + 1000) / 10);
      // sorted [10,20,...,90,1000]; p95 = ceil(0.95 * 10) - 1 = 9 → idx 9 → 1000
      expect(row.p95_ms).toBe(1000);
    } finally {
      db.close();
    }
  });

  it('--status filter shows only routes with at least one matching response, but counts remain over all', () => {
    const db = freshDb();
    try {
      seed(db, [
        { method: 'GET', path: '/quiet', status: 200, elapsed_ms: 50 },
        { method: 'GET', path: '/quiet', status: 200, elapsed_ms: 60 },
        { method: 'POST', path: '/orders', status: 201, elapsed_ms: 100 },
        { method: 'POST', path: '/orders', status: 201, elapsed_ms: 110 },
        { method: 'POST', path: '/orders', status: 500, elapsed_ms: 520 },
      ]);
      const out = endpoints(db, { status: { op: '>=', value: 500 } }).rows;
      // /quiet has no 5xx → excluded.
      // /orders has one 5xx → included; count=3, err_pct=33%.
      expect(out).toHaveLength(1);
      const row = out[0];
      expect(row.route).toBe('/orders');
      expect(row.count).toBe(3);
      expect(row.err_pct).toBeCloseTo((1 / 3) * 100);
    } finally {
      db.close();
    }
  });

  it('filters by branch', () => {
    const db = freshDb();
    try {
      seed(db, [
        { method: 'GET', path: '/x', status: 200, elapsed_ms: 100, branch: 'main' },
        { method: 'GET', path: '/y', status: 200, elapsed_ms: 100, branch: 'feature' },
      ]);
      expect(endpoints(db, { branch: 'main' }).rows).toHaveLength(1);
      expect(endpoints(db, { branch: 'main' }).rows[0].route).toBe('/x');
    } finally {
      db.close();
    }
  });

  it('filters by since/until', () => {
    const db = freshDb();
    try {
      seed(db, [
        { method: 'GET', path: '/x', status: 200, elapsed_ms: 100, timestamp: '2026-04-01T00:00:00.000Z' },
        { method: 'GET', path: '/x', status: 200, elapsed_ms: 100, timestamp: '2026-04-15T00:00:00.000Z' },
        { method: 'GET', path: '/x', status: 200, elapsed_ms: 100, timestamp: '2026-04-30T00:00:00.000Z' },
      ]);
      expect(endpoints(db, { since: '2026-04-10T00:00:00.000Z' }).rows[0].count).toBe(2);
      expect(
        endpoints(db, {
          since: '2026-04-10T00:00:00.000Z',
          until: '2026-04-20T00:00:00.000Z',
        }).rows[0].count
      ).toBe(1);
    } finally {
      db.close();
    }
  });

  it('sorts by the requested key', () => {
    const db = freshDb();
    try {
      seed(db, [
        { method: 'GET', path: '/a', status: 200, elapsed_ms: 100 },
        { method: 'GET', path: '/b', status: 200, elapsed_ms: 50 },
        { method: 'GET', path: '/b', status: 200, elapsed_ms: 50 },
        { method: 'GET', path: '/c', status: 500, elapsed_ms: 20 },
        { method: 'GET', path: '/d', status: 200, elapsed_ms: 200 },
      ]);
      const byCount = endpoints(db, { sort: 'count' }).rows.map((r) => r.route);
      expect(byCount[0]).toBe('/b'); // count 2
      const byErr = endpoints(db, { sort: 'err' }).rows.map((r) => r.route);
      expect(byErr[0]).toBe('/c'); // 100% err
      const byAvg = endpoints(db, { sort: 'avg' }).rows.map((r) => r.route);
      expect(byAvg[0]).toBe('/d'); // 200ms avg
      const byP95 = endpoints(db, { sort: 'p95' }).rows.map((r) => r.route);
      expect(byP95[0]).toBe('/d'); // 200ms p95
    } finally {
      db.close();
    }
  });

  it('sorts nulls last (a route with no measured duration ranks below a real 0)', () => {
    const db = freshDb();
    try {
      seed(db, [
        { method: 'GET', path: '/measured', status: 200, elapsed_ms: 0 },
        { method: 'GET', path: '/unmeasured', status: 200, elapsed_ms: null },
      ]);
      const byP95 = endpoints(db, { sort: 'p95' }).rows.map((r) => r.route);
      expect(byP95).toEqual(['/measured', '/unmeasured']);
    } finally {
      db.close();
    }
  });

  it('limits the result set', () => {
    const db = freshDb();
    try {
      seed(db, [
        { method: 'GET', path: '/a', status: 200, elapsed_ms: 100 },
        { method: 'GET', path: '/b', status: 200, elapsed_ms: 100 },
        { method: 'GET', path: '/c', status: 200, elapsed_ms: 100 },
      ]);
      expect(endpoints(db, { limit: 2 }).rows).toHaveLength(2);
    } finally {
      db.close();
    }
  });

  it('handles null elapsed_ms (avg and p95 derived from non-null values only)', () => {
    const db = freshDb();
    try {
      seed(db, [
        { method: 'GET', path: '/x', status: 200, elapsed_ms: 100 },
        { method: 'GET', path: '/x', status: 200, elapsed_ms: null },
      ]);
      const row = endpoints(db).rows[0];
      expect(row.count).toBe(2);
      expect(row.avg_ms).toBe(100);
      expect(row.p95_ms).toBe(100);
    } finally {
      db.close();
    }
  });
});
