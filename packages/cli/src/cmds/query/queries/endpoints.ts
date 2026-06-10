import sqlite3 from 'better-sqlite3';

import { Page, paginate } from '../lib/page';
import type { Comparator, NumberFilter } from '../lib/parseFilter';

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
  offset?: number;
}

// err_pct is fixed at "% of requests with status >= 500" (server errors),
// independent of any --status filter.
const ERR_THRESHOLD = 500;

const SORT_COLUMNS: Record<EndpointSort, string> = {
  count: 'count',
  avg: 'avg_ms',
  p95: 'p95_ms',
  err: 'err_pct',
};

const VALID_OPS = new Set<Comparator>(['=', '>=', '<=', '>', '<']);

// Aggregation runs entirely in SQL. Per route:
//   count         COUNT(*) over the partition
//   avg_ms        AVG(elapsed_ms) over non-null values
//   p95_ms        elapsed_ms at rank ceil(0.95 * measured_count) within
//                 the partition (computed with a ROW_NUMBER() window).
//   err_pct       100 * SUM(status >= 500) / COUNT(*)
// --status acts as a HAVING filter: route is shown iff ≥1 of its rows
// matches; aggregates remain over all rows.
//
// SQL injection surface: filter.sort and filter.status.op are validated
// against fixed allow-lists before being interpolated.
export function endpoints(
  db: sqlite3.Database,
  filter: EndpointsFilter = {}
): Page<EndpointRow> {
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (filter.branch) {
    where.push('a.git_branch = ?');
    params.push(filter.branch);
  }
  // --since/--until filter on the recording's timestamp (a.timestamp) —
  // the canonical recording-level attribute. find verbs use the same
  // column.
  if (filter.since) {
    where.push('a.timestamp >= ?');
    params.push(filter.since);
  }
  if (filter.until) {
    where.push('a.timestamp <= ?');
    params.push(filter.until);
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  let havingSql = '';
  if (filter.status) {
    if (!VALID_OPS.has(filter.status.op)) {
      throw new Error(`invalid status op: ${filter.status.op}`);
    }
    havingSql = `HAVING SUM(CASE WHEN status_code ${filter.status.op} ? THEN 1 ELSE 0 END) > 0`;
    params.push(filter.status.value);
  }

  const sortKey = filter.sort ?? 'count';
  if (!(sortKey in SORT_COLUMNS)) {
    throw new Error(`invalid sort key: ${sortKey}`);
  }
  const sortColumn = SORT_COLUMNS[sortKey];

  const sql = `
    WITH ranked AS (
      SELECT
        h.method                              AS method,
        COALESCE(h.normalized_path, h.path)   AS route,
        h.elapsed_ms                          AS elapsed_ms,
        h.status_code                         AS status_code,
        ROW_NUMBER() OVER (
          PARTITION BY h.method, COALESCE(h.normalized_path, h.path)
          ORDER BY h.elapsed_ms NULLS LAST
        ) AS rn,
        SUM(CASE WHEN h.elapsed_ms IS NOT NULL THEN 1 ELSE 0 END) OVER (
          PARTITION BY h.method, COALESCE(h.normalized_path, h.path)
        ) AS measured_count
      FROM http_requests h
      JOIN appmaps a ON a.id = h.appmap_id
      ${whereSql}
    )
    SELECT
      method,
      route,
      COUNT(*)                                                    AS count,
      AVG(CASE WHEN elapsed_ms IS NOT NULL THEN elapsed_ms END)   AS avg_ms,
      MAX(CASE
        WHEN measured_count > 0
          AND rn = (measured_count * 19 + 19) / 20
        THEN elapsed_ms
      END)                                                        AS p95_ms,
      CAST(SUM(CASE WHEN status_code >= ${ERR_THRESHOLD} THEN 1 ELSE 0 END) AS REAL)
        * 100.0 / COUNT(*)                                        AS err_pct
    FROM ranked
    GROUP BY method, route
    ${havingSql}
    ORDER BY ${sortColumn} DESC NULLS LAST, method, route
  `;

  const page = paginate<{
    method: string;
    route: string;
    count: number;
    avg_ms: number | null;
    p95_ms: number | null;
    err_pct: number | null;
  }>(db, sql, params, { limit: filter.limit, offset: filter.offset });

  return {
    ...page,
    rows: page.rows.map((r) => ({
      method: r.method,
      route: r.route,
      count: r.count,
      avg_ms: r.avg_ms,
      p95_ms: r.p95_ms,
      err_pct: r.err_pct ?? 0,
    })),
  };
}
