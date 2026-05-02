import sqlite3 from 'better-sqlite3';

import { endpoints } from './endpoints';

export interface CompareRow {
  method: string;
  route: string;
  a_count: number;
  a_p95_ms: number | null;
  b_count: number;
  b_p95_ms: number | null;
  // b_p95 / a_p95 — undefined when either side has no measured durations.
  delta: number | null;
}

export type CompareSort = 'delta' | 'p95-a' | 'p95-b';

export interface CompareFilter {
  branch_a: string;
  branch_b: string;
  since?: string;
  until?: string;
  sort?: CompareSort;
  limit?: number;
}

// Computes per-route p95 for two branches and merges the results, exposing
// delta = b_p95 / a_p95 alongside both sides' counts and p95s. Implementation
// reuses endpoints() (which already does the SQL window-function p95) so the
// p95 semantics match the endpoints verb exactly.
export function compare(db: sqlite3.Database, filter: CompareFilter): CompareRow[] {
  const a = endpoints(db, {
    branch: filter.branch_a,
    since: filter.since,
    until: filter.until,
  });
  const b = endpoints(db, {
    branch: filter.branch_b,
    since: filter.since,
    until: filter.until,
  });

  const rows = new Map<string, CompareRow>();
  const key = (method: string, route: string) => `${method}\t${route}`;

  for (const r of a) {
    rows.set(key(r.method, r.route), {
      method: r.method,
      route: r.route,
      a_count: r.count,
      a_p95_ms: r.p95_ms,
      b_count: 0,
      b_p95_ms: null,
      delta: null,
    });
  }
  for (const r of b) {
    const k = key(r.method, r.route);
    const existing = rows.get(k);
    if (existing) {
      existing.b_count = r.count;
      existing.b_p95_ms = r.p95_ms;
    } else {
      rows.set(k, {
        method: r.method,
        route: r.route,
        a_count: 0,
        a_p95_ms: null,
        b_count: r.count,
        b_p95_ms: r.p95_ms,
        delta: null,
      });
    }
  }

  for (const row of rows.values()) {
    if (row.a_p95_ms != null && row.a_p95_ms > 0 && row.b_p95_ms != null) {
      row.delta = row.b_p95_ms / row.a_p95_ms;
    }
  }

  const result = [...rows.values()];
  const sortKey: CompareSort = filter.sort ?? 'delta';
  result.sort(comparators[sortKey]);

  return filter.limit !== undefined ? result.slice(0, filter.limit) : result;
}

// "delta" sorts by absolute deviation from 1× — biggest changes (in
// either direction) at the top. "p95-a" / "p95-b" sort by the named side
// descending. All keys put nulls last.
function descNullsLast(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return b - a;
}

const comparators: Record<CompareSort, (a: CompareRow, b: CompareRow) => number> = {
  delta: (x, y) => {
    const xd = x.delta == null ? null : Math.abs(Math.log(x.delta));
    const yd = y.delta == null ? null : Math.abs(Math.log(y.delta));
    return descNullsLast(xd, yd);
  },
  'p95-a': (x, y) => descNullsLast(x.a_p95_ms, y.a_p95_ms),
  'p95-b': (x, y) => descNullsLast(x.b_p95_ms, y.b_p95_ms),
};
