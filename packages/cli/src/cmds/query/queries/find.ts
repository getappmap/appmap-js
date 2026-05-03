import sqlite3 from 'better-sqlite3';

import type { NumberFilter } from '../lib/parseFilter';
import {
  appmapIdScope,
  appmapWhere,
  classFilterClauses,
  httpScopeClauses,
  methodFilterClauses,
  parseRoute,
  sqlCallerClassClauses,
  sqlCallerMethodClauses,
} from '../lib/scope';

export type FindType = 'appmaps' | 'requests' | 'queries' | 'calls' | 'exceptions' | 'logs';

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
  logger?: string;         // --logger (find logs); class of the logging fn
  message?: string;        // --message (find logs); substring of the log line
  limit?: number;
  offset?: number;
}

export interface FindAppmapRow {
  appmap_id: number;
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
  path: string | null;
  lineno: number | null;
  elapsed_ms: number | null;
  parameters_json: string | null;
  return_value: string | null;
}

export interface FindLogRow {
  appmap_name: string;
  event_id: number;
  parent_event_id: number | null;
  logger: string;          // defined_class of the logging fn
  method_id: string;
  path: string | null;
  lineno: number | null;
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
  const h = httpScopeClauses(filter, 'h2');
  const requireHttpMatch = h.where.length > 0;

  // Pick a deterministic "sample" request per appmap via a correlated
  // subquery: the http_request with the smallest event_id among those
  // matching --route / --status (or any request if no http filter). This
  // avoids the non-determinism of GROUP BY a.id with non-aggregated h.*.
  const innerHttpFilter = requireHttpMatch ? ` AND ${h.where.join(' AND ')}` : '';

  const whereParts: string[] = [...a.where];
  if (requireHttpMatch) whereParts.push('h.id IS NOT NULL');
  if (filter.duration) {
    whereParts.push(`a.elapsed_ms ${filter.duration.op} ?`);
  }
  const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

  // Param order: inner subquery http filters → outer WHERE (appmap, then duration).
  const params: (string | number)[] = [...h.params, ...a.params];
  if (filter.duration) params.push(filter.duration.value);

  let sql = `
    SELECT a.id                                       AS appmap_id,
           a.name                                     AS appmap_name,
           COALESCE(h.normalized_path, h.path)        AS route,
           h.status_code                              AS status_code,
           COALESCE(h.elapsed_ms, a.elapsed_ms)       AS elapsed_ms,
           a.sql_query_count                          AS sql_count,
           a.git_branch                               AS branch,
           a.timestamp                                AS timestamp
    FROM appmaps a
    LEFT JOIN http_requests h ON h.id = (
      SELECT h2.id FROM http_requests h2
      WHERE h2.appmap_id = a.id${innerHttpFilter}
      ORDER BY h2.event_id LIMIT 1
    )
    ${whereSql}
    ORDER BY a.timestamp, a.name
  `;
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
    // The caller of a sql_query is the function_call referenced by
    // q.parent_event_id, which has its own code_object link. Use that
    // canonical path; fall back to the denormalized caller_class string
    // when the parent function_call has no code_object link.
    const c = sqlCallerClassClauses(filter.className, 'q');
    where.push(...c.where);
    params.push(...c.params);
  }
  if (filter.method) {
    const m = sqlCallerMethodClauses(filter.method, 'q');
    where.push(...m.where);
    params.push(...m.params);
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
           fc.path AS path,
           fc.lineno AS lineno,
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

// Log rows: function_calls whose linked code_object has the canonical
// 'log' label. The label is the contract — it tells the importer to
// capture parameters_json + return_value, and tells us which calls are
// loggers. --message is a SQL LIKE substring against both columns;
// false positives (matching a parameter name, a class name, or a JSON
// punctuation byte) are accepted by design and can be tightened in
// post-processing.
export function findLogs(db: sqlite3.Database, filter: FindFilter): FindLogRow[] {
  const where: string[] = [
    `fc.code_object_id IN (SELECT l.code_object_id FROM labels l WHERE l.label = 'log')`,
  ];
  const params: (string | number)[] = [];

  const scope = appmapIdScope(filter, 'fc');
  if (scope) {
    where.push(scope.sql);
    params.push(...scope.params);
  }

  if (filter.logger) {
    const c = classFilterClauses(filter.logger, 'fc');
    where.push(...c.where);
    params.push(...c.params);
  }

  if (filter.message) {
    where.push(`(fc.parameters_json LIKE ? OR fc.return_value LIKE ?)`);
    const like = `%${filter.message}%`;
    params.push(like, like);
  }

  let sql = `
    SELECT a.name AS appmap_name,
           fc.event_id AS event_id,
           fc.parent_event_id AS parent_event_id,
           fc.defined_class AS logger,
           fc.method_id AS method_id,
           fc.path AS path,
           fc.lineno AS lineno,
           fc.parameters_json AS parameters_json,
           fc.return_value AS return_value
    FROM function_calls fc
    JOIN appmaps a ON a.id = fc.appmap_id
    WHERE ${where.join(' AND ')}
    ORDER BY a.source_path, fc.event_id
  `;
  sql = appendLimitOffset(sql, filter, params);
  return db.prepare(sql).all(...params) as FindLogRow[];
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
    case 'logs':
      return findLogs(db, filter);
  }
}
