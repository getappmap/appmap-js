import sqlite3 from 'better-sqlite3';

import type { NumberFilter } from '../lib/parseFilter';
import {
  appmapIdScope,
  appmapWhere,
  classFilterClauses,
  httpScopeClauses,
  methodFilterClauses,
  parseRoute,
} from '../lib/scope';

export type FindType = 'appmaps' | 'requests' | 'queries' | 'calls' | 'exceptions';

export interface FindFilter {
  route?: string;          // "POST /orders" or "/orders"
  className?: string;      // --class (TS reserved word workaround)
  method?: string;         // --method (method_id, not HTTP method)
  label?: string;          // --label
  branch?: string;
  commit?: string;
  status?: NumberFilter;   // --status N / >=N
  duration?: NumberFilter; // --duration ">1s" → ms
  since?: string;
  until?: string;
  appmap?: string;         // appmap name (or basename of source_path)
  table?: string;          // SQL table name (find queries)
  exception?: string;      // exception class (find exceptions)
  limit?: number;
  offset?: number;
}

export interface FindAppmapRow {
  appmap_name: string;
  route: string | null;
  status_code: number | null;
  elapsed_ms: number | null;
  sql_count: number;
  branch: string | null;
  timestamp: string | null;
}

export interface FindRequestRow {
  appmap_name: string;
  event_id: number;
  method: string;
  route: string;
  status_code: number;
  elapsed_ms: number | null;
  branch: string | null;
}

export interface FindQueryRow {
  appmap_name: string;
  event_id: number;
  elapsed_ms: number | null;
  caller_class: string | null;
  caller_method: string | null;
  sql_text: string;
}

export interface FindCallRow {
  appmap_name: string;
  event_id: number;
  fqid: string | null;
  defined_class: string;
  method_id: string;
  elapsed_ms: number | null;
  parameters_json: string | null;
  return_value: string | null;
}

export interface FindExceptionRow {
  appmap_name: string;
  event_id: number;
  exception_class: string;
  message: string | null;
  path: string | null;
  lineno: number | null;
}

// --- internal helpers (find-specific) ---

interface Clauses {
  where: string[];
  params: (string | number)[];
}

function durationClause(filter: FindFilter, column: string): Clauses {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filter.duration) {
    where.push(`${column} ${filter.duration.op} ?`);
    params.push(filter.duration.value);
  }
  return { where, params };
}

function appendLimitOffset(sql: string, filter: FindFilter, params: (string | number)[]): string {
  let result = sql;
  if (filter.limit !== undefined) {
    result += ' LIMIT ?';
    params.push(filter.limit);
    if (filter.offset !== undefined) {
      result += ' OFFSET ?';
      params.push(filter.offset);
    }
  } else if (filter.offset !== undefined) {
    // OFFSET without LIMIT: SQLite requires a LIMIT; use -1 (unbounded).
    result += ' LIMIT -1 OFFSET ?';
    params.push(filter.offset);
  }
  return result;
}

// --- per-type queries ---

export function findAppmaps(db: sqlite3.Database, filter: FindFilter): FindAppmapRow[] {
  const a = appmapWhere(filter, 'a');
  const h = httpScopeClauses(filter);

  let sql: string;
  const params: (string | number)[] = [];

  // Show one row per appmap, joining its first matching (or any) HTTP request.
  if (h.where.length > 0) {
    const where = [...a.where, ...h.where].filter(Boolean).join(' AND ');
    sql = `
      SELECT a.name                              AS appmap_name,
             COALESCE(h.normalized_path, h.path) AS route,
             h.status_code                       AS status_code,
             h.elapsed_ms                        AS elapsed_ms,
             a.sql_query_count                   AS sql_count,
             a.git_branch                        AS branch,
             a.timestamp                         AS timestamp
      FROM appmaps a
      JOIN http_requests h ON h.appmap_id = a.id
      ${where ? `WHERE ${where}` : ''}
      GROUP BY a.id
      ORDER BY a.timestamp, a.name
    `;
    params.push(...a.params, ...h.params);
  } else {
    const where = a.where.join(' AND ');
    sql = `
      SELECT a.name AS appmap_name,
             (SELECT COALESCE(h.normalized_path, h.path)
                FROM http_requests h WHERE h.appmap_id = a.id
                ORDER BY h.event_id LIMIT 1)               AS route,
             (SELECT h.status_code FROM http_requests h
                WHERE h.appmap_id = a.id ORDER BY h.event_id LIMIT 1) AS status_code,
             a.elapsed_ms,
             a.sql_query_count AS sql_count,
             a.git_branch AS branch,
             a.timestamp AS timestamp
      FROM appmaps a
      ${where ? `WHERE ${where}` : ''}
      ORDER BY a.timestamp, a.name
    `;
    params.push(...a.params);
  }

  sql = appendLimitOffset(sql, filter, params);
  return db.prepare(sql).all(...params) as FindAppmapRow[];
}

export function findRequests(db: sqlite3.Database, filter: FindFilter): FindRequestRow[] {
  const a = appmapWhere(filter, 'a');
  const where: string[] = [...a.where];
  const params: (string | number)[] = [...a.params];

  if (filter.route) {
    const route = parseRoute(filter.route);
    where.push(`COALESCE(h.normalized_path, h.path) = ?`);
    params.push(route.path);
    if (route.method) {
      where.push(`h.method = ?`);
      params.push(route.method);
    }
  }
  if (filter.status) {
    where.push(`h.status_code ${filter.status.op} ?`);
    params.push(filter.status.value);
  }
  const dur = durationClause(filter, 'h.elapsed_ms');
  where.push(...dur.where);
  params.push(...dur.params);

  let sql = `
    SELECT a.name AS appmap_name,
           h.event_id AS event_id,
           h.method AS method,
           COALESCE(h.normalized_path, h.path) AS route,
           h.status_code AS status_code,
           h.elapsed_ms AS elapsed_ms,
           a.git_branch AS branch
    FROM http_requests h
    JOIN appmaps a ON a.id = h.appmap_id
    ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY a.source_path, h.event_id
  `;
  sql = appendLimitOffset(sql, filter, params);
  return db.prepare(sql).all(...params) as FindRequestRow[];
}

export function findQueries(db: sqlite3.Database, filter: FindFilter): FindQueryRow[] {
  const where: string[] = [];
  const params: (string | number)[] = [];

  const scope = appmapIdScope(filter, 'q');
  if (scope) {
    where.push(scope.sql);
    params.push(...scope.params);
  }

  if (filter.table) {
    where.push(`q.sql_text LIKE ?`);
    params.push(`%${filter.table}%`);
  }
  if (filter.className) {
    where.push(`q.caller_class = ?`);
    params.push(filter.className);
  }
  if (filter.method) {
    where.push(`q.caller_method = ?`);
    params.push(filter.method);
  }
  const dur = durationClause(filter, 'q.elapsed_ms');
  where.push(...dur.where);
  params.push(...dur.params);

  let sql = `
    SELECT a.name AS appmap_name,
           q.event_id AS event_id,
           q.elapsed_ms AS elapsed_ms,
           q.caller_class AS caller_class,
           q.caller_method AS caller_method,
           q.sql_text AS sql_text
    FROM sql_queries q
    JOIN appmaps a ON a.id = q.appmap_id
    ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY a.source_path, q.event_id
  `;
  sql = appendLimitOffset(sql, filter, params);
  return db.prepare(sql).all(...params) as FindQueryRow[];
}

export function findCalls(db: sqlite3.Database, filter: FindFilter): FindCallRow[] {
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
  if (filter.method) {
    const m = methodFilterClauses(filter.method, 'fc');
    where.push(...m.where);
    params.push(...m.params);
  }
  if (filter.label) {
    where.push(
      `fc.code_object_id IN (SELECT l.code_object_id FROM labels l WHERE l.label = ?)`
    );
    params.push(filter.label);
  }
  const dur = durationClause(filter, 'fc.elapsed_ms');
  where.push(...dur.where);
  params.push(...dur.params);

  let sql = `
    SELECT a.name AS appmap_name,
           fc.event_id AS event_id,
           co.fqid AS fqid,
           fc.defined_class AS defined_class,
           fc.method_id AS method_id,
           fc.elapsed_ms AS elapsed_ms,
           fc.parameters_json AS parameters_json,
           fc.return_value AS return_value
    FROM function_calls fc
    JOIN appmaps a ON a.id = fc.appmap_id
    LEFT JOIN code_objects co ON co.id = fc.code_object_id
    ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY a.source_path, fc.event_id
  `;
  sql = appendLimitOffset(sql, filter, params);
  return db.prepare(sql).all(...params) as FindCallRow[];
}

export function findExceptions(db: sqlite3.Database, filter: FindFilter): FindExceptionRow[] {
  const where: string[] = [];
  const params: (string | number)[] = [];

  const scope = appmapIdScope(filter, 'e');
  if (scope) {
    where.push(scope.sql);
    params.push(...scope.params);
  }

  if (filter.exception) {
    where.push(`e.exception_class = ?`);
    params.push(filter.exception);
  }

  let sql = `
    SELECT a.name AS appmap_name,
           e.event_id AS event_id,
           e.exception_class AS exception_class,
           e.message AS message,
           e.path AS path,
           e.lineno AS lineno
    FROM exceptions e
    JOIN appmaps a ON a.id = e.appmap_id
    ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY a.source_path, e.event_id, e.exception_class
  `;
  sql = appendLimitOffset(sql, filter, params);
  return db.prepare(sql).all(...params) as FindExceptionRow[];
}

// Dispatcher.
export function find(
  db: sqlite3.Database,
  type: FindType,
  filter: FindFilter
): unknown[] {
  switch (type) {
    case 'appmaps':
      return findAppmaps(db, filter);
    case 'requests':
      return findRequests(db, filter);
    case 'queries':
      return findQueries(db, filter);
    case 'calls':
      return findCalls(db, filter);
    case 'exceptions':
      return findExceptions(db, filter);
  }
}
