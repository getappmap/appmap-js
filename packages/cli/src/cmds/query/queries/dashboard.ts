import sqlite3 from 'better-sqlite3';

// Recording-set totals shown on the UI's dashboard. One round-trip query
// — every value is a SELECT subquery so the cost is one statement.
//
// avg_request_ms is a coarse "average HTTP request latency across the
// whole DB" measurement; the per-route breakdown lives in endpoints().
// earliest/latest read appmaps.timestamp because http_requests has no
// per-row timestamp in this schema.
export interface DashboardTotals {
  recordings: number;
  requests: number;
  queries: number;
  exceptions: number;
  calls: number;
  avg_request_ms: number | null;
  earliest: string | null;
  latest: string | null;
}

export function dashboardTotals(db: sqlite3.Database): DashboardTotals {
  return db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM appmaps)                                                AS recordings,
         (SELECT COUNT(*) FROM http_requests)                                          AS requests,
         (SELECT COUNT(*) FROM sql_queries WHERE sql_text NOT IN ('BEGIN', 'COMMIT'))  AS queries,
         (SELECT COUNT(*) FROM exceptions)                                             AS exceptions,
         (SELECT COUNT(*) FROM function_calls)                                         AS calls,
         (SELECT AVG(elapsed_ms) FROM http_requests WHERE elapsed_ms IS NOT NULL)      AS avg_request_ms,
         (SELECT MIN(timestamp) FROM appmaps WHERE timestamp IS NOT NULL)              AS earliest,
         (SELECT MAX(timestamp) FROM appmaps WHERE timestamp IS NOT NULL)              AS latest`
    )
    .get() as DashboardTotals;
}
