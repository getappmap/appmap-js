import sqlite3 from 'better-sqlite3';

import { appmapIdScope, classFilterClauses, RecordingScope } from '../lib/scope';

export type HotspotType = 'function' | 'sql';

export interface HotspotsFilter extends RecordingScope {
  type?: HotspotType;
  className?: string;   // function mode only
  limit?: number;
}

export interface FunctionHotspotRow {
  fqid: string | null;
  defined_class: string;
  method_id: string;
  // Representative source location: one call's path/lineno from the
  // aggregated set. Useful for "show me the source of this hotspot"
  // without a follow-up lookup.
  path: string | null;
  lineno: number | null;
  calls: number;
  total_ms: number;
  self_ms: number;
}

export interface SqlHotspotRow {
  count: number;
  avg_ms: number;
  total_ms: number;
  sql_text: string;
}

// SELF_MS = elapsed_ms - sum of immediate children's elapsed_ms, where a
// child is any function_call / sql_query / http_client_request whose
// parent_event_id points at this call. Computed via a one-pass CTE that
// pre-aggregates per-event child time, so the join is O(rows) regardless of
// nesting depth.
const CHILD_TIME_CTE = `
  WITH child_events AS (
    SELECT appmap_id, parent_event_id, elapsed_ms FROM function_calls
    UNION ALL
    SELECT appmap_id, parent_event_id, elapsed_ms FROM sql_queries
    UNION ALL
    SELECT appmap_id, parent_event_id, elapsed_ms FROM http_client_requests
  ),
  child_time AS (
    SELECT appmap_id, parent_event_id AS event_id,
           SUM(COALESCE(elapsed_ms, 0)) AS sum_children
    FROM child_events
    WHERE parent_event_id IS NOT NULL
    GROUP BY appmap_id, parent_event_id
  )
`;

export function functionHotspots(
  db: sqlite3.Database,
  filter: HotspotsFilter
): FunctionHotspotRow[] {
  const where: string[] = [];
  const params: (string | number)[] = [];

  const scope = appmapIdScope(filter, 'fc');
  if (scope) {
    where.push(scope.sql);
    params.push(...scope.params);
  }
  if (filter.className) {
    const c = classFilterClauses(filter.className, 'fc');
    where.push(...c.where);
    params.push(...c.params);
  }

  let sql = `
    ${CHILD_TIME_CTE}
    SELECT
      co.fqid                                        AS fqid,
      fc.defined_class                               AS defined_class,
      fc.method_id                                   AS method_id,
      MIN(fc.path)                                   AS path,
      MIN(fc.lineno)                                 AS lineno,
      COUNT(*)                                       AS calls,
      SUM(COALESCE(fc.elapsed_ms, 0))                AS total_ms,
      SUM(COALESCE(fc.elapsed_ms, 0)
          - COALESCE(ct.sum_children, 0))            AS self_ms
    FROM function_calls fc
    LEFT JOIN child_time ct
      ON ct.appmap_id = fc.appmap_id AND ct.event_id = fc.event_id
    LEFT JOIN code_objects co ON co.id = fc.code_object_id
    ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
    GROUP BY fc.code_object_id, fc.defined_class, fc.method_id
    ORDER BY total_ms DESC
  `;
  if (filter.limit !== undefined) {
    sql += ' LIMIT ?';
    params.push(filter.limit);
  }
  return db.prepare(sql).all(...params) as FunctionHotspotRow[];
}

export function sqlHotspots(db: sqlite3.Database, filter: HotspotsFilter): SqlHotspotRow[] {
  const where: string[] = [];
  const params: (string | number)[] = [];

  const scope = appmapIdScope(filter, 'q');
  if (scope) {
    where.push(scope.sql);
    params.push(...scope.params);
  }

  let sql = `
    SELECT
      COUNT(*)                          AS count,
      AVG(q.elapsed_ms)                 AS avg_ms,
      SUM(COALESCE(q.elapsed_ms, 0))    AS total_ms,
      q.sql_text                        AS sql_text
    FROM sql_queries q
    ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
    GROUP BY q.sql_text
    ORDER BY total_ms DESC
  `;
  if (filter.limit !== undefined) {
    sql += ' LIMIT ?';
    params.push(filter.limit);
  }
  return db.prepare(sql).all(...params) as SqlHotspotRow[];
}

export function hotspots(
  db: sqlite3.Database,
  filter: HotspotsFilter
): FunctionHotspotRow[] | SqlHotspotRow[] {
  return filter.type === 'sql' ? sqlHotspots(db, filter) : functionHotspots(db, filter);
}
