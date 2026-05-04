import sqlite3 from 'better-sqlite3';

import { openQueryDb } from '../../../../../src/cmds/query/db/openQueryDb';
import { compare } from '../../../../../src/cmds/query/queries/compare';

function freshDb(): sqlite3.Database {
  return openQueryDb('/tmp/ignored', ':memory:').db;
}

interface SeedReq {
  branch: string;
  method: string;
  path: string;
  status: number;
  elapsed_ms?: number;
}

let nextEvent = 1;
function seed(db: sqlite3.Database, reqs: SeedReq[]): void {
  const insAm = db.prepare(
    `INSERT INTO appmaps (name, source_path, git_branch, timestamp) VALUES (?, ?, ?, ?)`
  );
  const insReq = db.prepare(
    `INSERT INTO http_requests (appmap_id, event_id, method, path, status_code, elapsed_ms)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  for (let i = 0; i < reqs.length; i++) {
    const r = reqs[i];
    const am = insAm.run(
      `rec-${i}`,
      `/tmp/rec-${i}.appmap.json`,
      r.branch,
      '2026-04-29T12:00:00.000Z'
    );
    insReq.run(
      am.lastInsertRowid,
      nextEvent++,
      r.method,
      r.path,
      r.status,
      r.elapsed_ms ?? null
    );
  }
}

describe('compare', () => {
  beforeEach(() => {
    nextEvent = 1;
  });

  it('reports a per-route delta = b_p95 / a_p95', () => {
    const db = freshDb();
    try {
      // Same route on both branches: main is fast, feature is slow.
      seed(db, [
        { branch: 'main', method: 'GET', path: '/reports', status: 200, elapsed_ms: 200 },
        { branch: 'main', method: 'GET', path: '/reports', status: 200, elapsed_ms: 210 },
        { branch: 'feat', method: 'GET', path: '/reports', status: 200, elapsed_ms: 6000 },
        { branch: 'feat', method: 'GET', path: '/reports', status: 200, elapsed_ms: 6100 },
      ]);
      const rows = compare(db, { branch_a: 'main', branch_b: 'feat' }).rows;
      expect(rows).toHaveLength(1);
      const r = rows[0];
      expect(r.method).toBe('GET');
      expect(r.route).toBe('/reports');
      expect(r.delta).not.toBeNull();
      // ~30× slowdown
      expect(r.delta!).toBeGreaterThan(20);
    } finally {
      db.close();
    }
  });

  it('preserves routes that exist on only one side', () => {
    const db = freshDb();
    try {
      seed(db, [
        { branch: 'main', method: 'GET', path: '/old', status: 200, elapsed_ms: 100 },
        { branch: 'feat', method: 'GET', path: '/new', status: 200, elapsed_ms: 50 },
      ]);
      const rows = compare(db, { branch_a: 'main', branch_b: 'feat' }).rows;
      const old = rows.find((r) => r.route === '/old')!;
      const fresh = rows.find((r) => r.route === '/new')!;
      expect(old.a_p95_ms).toBe(100);
      expect(old.b_p95_ms).toBeNull();
      expect(old.delta).toBeNull();
      expect(fresh.a_p95_ms).toBeNull();
      expect(fresh.b_p95_ms).toBe(50);
      expect(fresh.delta).toBeNull();
    } finally {
      db.close();
    }
  });

  it('--sort=delta puts the biggest absolute change first (in either direction)', () => {
    const db = freshDb();
    try {
      seed(db, [
        // /a: 10× slowdown
        { branch: 'main', method: 'GET', path: '/a', status: 200, elapsed_ms: 100 },
        { branch: 'feat', method: 'GET', path: '/a', status: 200, elapsed_ms: 1000 },
        // /b: 5× speedup
        { branch: 'main', method: 'GET', path: '/b', status: 200, elapsed_ms: 500 },
        { branch: 'feat', method: 'GET', path: '/b', status: 200, elapsed_ms: 100 },
        // /c: ~unchanged
        { branch: 'main', method: 'GET', path: '/c', status: 200, elapsed_ms: 100 },
        { branch: 'feat', method: 'GET', path: '/c', status: 200, elapsed_ms: 105 },
      ]);
      const rows = compare(db, { branch_a: 'main', branch_b: 'feat', sort: 'delta' }).rows;
      // /a (10×) and /b (1/5×) have the largest log-delta; /c last.
      expect(rows[rows.length - 1].route).toBe('/c');
    } finally {
      db.close();
    }
  });

  it('--limit caps the result set', () => {
    const db = freshDb();
    try {
      seed(db, [
        { branch: 'main', method: 'GET', path: '/a', status: 200, elapsed_ms: 100 },
        { branch: 'main', method: 'GET', path: '/b', status: 200, elapsed_ms: 100 },
        { branch: 'feat', method: 'GET', path: '/a', status: 200, elapsed_ms: 100 },
        { branch: 'feat', method: 'GET', path: '/b', status: 200, elapsed_ms: 100 },
      ]);
      expect(
        compare(db, { branch_a: 'main', branch_b: 'feat', limit: 1 }).rows
      ).toHaveLength(1);
    } finally {
      db.close();
    }
  });
});
