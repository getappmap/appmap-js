import sqlite3 from 'better-sqlite3';

import type { NumberFilter } from '../lib/parseFilter';

export interface EndpointRow {
  method: string;
  route: string;
  count: number;
  avg_ms: number | null;
  p95_ms: number | null;
  err_pct: number;
}

export type EndpointSort = 'count' | 'avg' | 'p95' | 'err';

export interface EndpointsFilter {
  // ISO timestamp (use parseTime to build).
  since?: string;
  until?: string;
  branch?: string;
  // --status N (or comparator). Acts as a HAVING-style filter on routes:
  // a route is shown iff at least one of its requests matches. Counts /
  // averages / p95 / err_pct remain over all of that route's requests.
  status?: NumberFilter;
  sort?: EndpointSort;
  limit?: number;
}

// err_pct is fixed at "% of requests with status >= 500" (server errors),
// independent of any --status filter.
const ERR_THRESHOLD = 500;

interface RawRow {
  method: string;
  route: string;
  elapsed_ms: number | null;
  status_code: number;
}

export function endpoints(
  db: sqlite3.Database,
  filter: EndpointsFilter = {}
): EndpointRow[] {
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (filter.branch) {
    where.push('a.git_branch = ?');
    params.push(filter.branch);
  }
  if (filter.since) {
    where.push('hr.timestamp >= ?');
    params.push(filter.since);
  }
  if (filter.until) {
    where.push('hr.timestamp <= ?');
    params.push(filter.until);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const rows = db
    .prepare(
      `SELECT
         hr.method                                AS method,
         COALESCE(hr.normalized_path, hr.path)    AS route,
         hr.elapsed_ms                            AS elapsed_ms,
         hr.status_code                           AS status_code
       FROM http_requests hr
       JOIN appmaps a ON a.id = hr.appmap_id
       ${whereSql}`
    )
    .all(...params) as RawRow[];

  interface Group {
    method: string;
    route: string;
    elapsed: number[];
    err: number;
    matched: number;
    total: number;
  }
  const groups = new Map<string, Group>();
  const matchPredicate = (s: number): boolean => {
    if (!filter.status) return true;
    const { op, value } = filter.status;
    return (
      (op === '=' && s === value) ||
      (op === '>=' && s >= value) ||
      (op === '<=' && s <= value) ||
      (op === '>' && s > value) ||
      (op === '<' && s < value)
    );
  };

  for (const r of rows) {
    const key = `${r.method}\t${r.route}`;
    let g = groups.get(key);
    if (!g) {
      g = { method: r.method, route: r.route, elapsed: [], err: 0, matched: 0, total: 0 };
      groups.set(key, g);
    }
    g.total += 1;
    if (typeof r.elapsed_ms === 'number') g.elapsed.push(r.elapsed_ms);
    if (r.status_code >= ERR_THRESHOLD) g.err += 1;
    if (matchPredicate(r.status_code)) g.matched += 1;
  }

  const result: EndpointRow[] = [];
  for (const g of groups.values()) {
    if (filter.status && g.matched === 0) continue;
    const sorted = [...g.elapsed].sort((a, b) => a - b);
    result.push({
      method: g.method,
      route: g.route,
      count: g.total,
      avg_ms: sorted.length === 0 ? null : sorted.reduce((s, v) => s + v, 0) / sorted.length,
      p95_ms: percentile(sorted, 0.95),
      err_pct: g.total > 0 ? (g.err / g.total) * 100 : 0,
    });
  }

  const sortKey: EndpointSort = filter.sort ?? 'count';
  result.sort(comparators[sortKey]);

  return filter.limit !== undefined ? result.slice(0, filter.limit) : result;
}

function percentile(sorted: readonly number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.max(0, Math.ceil(sorted.length * p) - 1);
  return sorted[idx];
}

const comparators: Record<EndpointSort, (a: EndpointRow, b: EndpointRow) => number> = {
  count: (a, b) => b.count - a.count,
  avg: (a, b) => (b.avg_ms ?? 0) - (a.avg_ms ?? 0),
  p95: (a, b) => (b.p95_ms ?? 0) - (a.p95_ms ?? 0),
  err: (a, b) => b.err_pct - a.err_pct,
};
