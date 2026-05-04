import sqlite3 from 'better-sqlite3';

import { DEFAULT_PAGE_LIMIT, Page } from '../lib/page';
import { appmapWhere, httpScopeClauses, RecordingScope } from '../lib/scope';
import { resolveAppmap } from './tree';

// Score weights, from V3:
//   same HTTP route   ×5  (binary)
//   same SQL tables   ×3  (per shared table)
//   same classes      ×2  (per shared class)
const ROUTE_WEIGHT = 5;
const TABLE_WEIGHT = 3;
const CLASS_WEIGHT = 2;

// Heuristic table-name extraction. Matches identifiers following
// FROM/JOIN/INTO/UPDATE; strips a single leading schema qualifier and
// lowercases for case-insensitive matching. Imperfect (won't handle
// nested subqueries / unusual quoting cleanly) but adequate for the
// similarity score, which is itself a heuristic.
const TABLE_PATTERN = /\b(?:FROM|JOIN|INTO|UPDATE)\s+["`]?(?:\w+\.)?(\w+)["`]?/gi;

export function extractTables(sqlText: string): Set<string> {
  const tables = new Set<string>();
  TABLE_PATTERN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TABLE_PATTERN.exec(sqlText)) !== null) {
    tables.add(m[1].toLowerCase());
  }
  return tables;
}

export interface RelatedRow {
  appmap_name: string;
  score: number;
  method: string | null;
  route: string | null;
  status_code: number | null;
  elapsed_ms: number | null;
  shared: string[];
}

export interface RelatedFilter extends RecordingScope {
  limit?: number;
  offset?: number;
}

interface AppmapSig {
  id: number;
  name: string;
  method: string | null;
  route: string | null;
  status_code: number | null;
  elapsed_ms: number | null;
  tables: Set<string>;
  classes: Set<string>;
}

// Strip trailing class name from a defined_class string. Handles Java/Python
// dot-form ("org.example.X" → "X") and Ruby/C++ chain ("Foo::Bar" → "Bar").
function leafFromDefinedClass(s: string): string {
  const ddIdx = s.lastIndexOf('::');
  const dotIdx = s.lastIndexOf('.');
  const idx = Math.max(ddIdx, dotIdx);
  return idx >= 0 ? s.slice(idx + (s[idx] === ':' ? 2 : 1)) : s;
}

function loadSignature(db: sqlite3.Database, appmapId: number): AppmapSig {
  const meta = db
    .prepare(
      `SELECT a.id, a.name, a.elapsed_ms,
              (SELECT h.method FROM http_requests h WHERE h.appmap_id = a.id
                 ORDER BY h.event_id LIMIT 1) AS method,
              (SELECT COALESCE(h.normalized_path, h.path) FROM http_requests h
                 WHERE h.appmap_id = a.id ORDER BY h.event_id LIMIT 1) AS route,
              (SELECT h.status_code FROM http_requests h
                 WHERE h.appmap_id = a.id ORDER BY h.event_id LIMIT 1) AS status_code
       FROM appmaps a WHERE a.id = ?`
    )
    .get(appmapId) as {
    id: number;
    name: string;
    elapsed_ms: number | null;
    method: string | null;
    route: string | null;
    status_code: number | null;
  };

  const sqlRows = db
    .prepare(`SELECT sql_text FROM sql_queries WHERE appmap_id = ?`)
    .all(appmapId) as { sql_text: string }[];
  const tables = new Set<string>();
  for (const r of sqlRows) for (const t of extractTables(r.sql_text)) tables.add(t);

  const classes = new Set<string>();
  for (const r of db
    .prepare(
      `SELECT DISTINCT co.leaf_class AS name FROM code_objects co
       JOIN function_calls fc ON fc.code_object_id = co.id
       WHERE fc.appmap_id = ?`
    )
    .all(appmapId) as { name: string }[]) {
    if (r.name) classes.add(r.name);
  }
  // Fall back to defined_class for unlinked rows so sparsely-linked
  // recordings still contribute classes to the score.
  for (const r of db
    .prepare(
      `SELECT DISTINCT fc.defined_class AS name FROM function_calls fc
       WHERE fc.appmap_id = ? AND fc.code_object_id IS NULL`
    )
    .all(appmapId) as { name: string }[]) {
    if (r.name) classes.add(leafFromDefinedClass(r.name));
  }

  return { ...meta, tables, classes };
}

export function related(
  db: sqlite3.Database,
  sourceRef: string,
  filter: RelatedFilter = {}
): Page<RelatedRow> {
  const source = resolveAppmap(db, sourceRef);
  const sourceSig = loadSignature(db, source.id);

  // Candidate pool: appmaps matching recording-level / http filters,
  // excluding the source itself.
  const a = appmapWhere(filter, 'a');
  const h = httpScopeClauses(filter);

  const whereParts: string[] = ['a.id != ?'];
  const params: (string | number)[] = [source.id];

  whereParts.push(...a.where);
  params.push(...a.params);

  if (h.where.length > 0) {
    whereParts.push(`EXISTS (
      SELECT 1 FROM http_requests h WHERE h.appmap_id = a.id AND ${h.where.join(' AND ')}
    )`);
    params.push(...h.params);
  }

  const candidates = db
    .prepare(`SELECT a.id FROM appmaps a WHERE ${whereParts.join(' AND ')} ORDER BY a.id`)
    .all(...params) as { id: number }[];

  const scored: RelatedRow[] = [];
  for (const c of candidates) {
    const sig = loadSignature(db, c.id);

    let score = 0;
    const shared: string[] = [];

    // Route match (binary). Method is part of the comparison only if the
    // source has one — recordings without an http_server_request are
    // matched purely on path.
    if (
      sourceSig.route &&
      sig.route === sourceSig.route &&
      (!sourceSig.method || sig.method === sourceSig.method)
    ) {
      score += ROUTE_WEIGHT;
      shared.push('route');
    }

    for (const t of sig.tables) {
      if (sourceSig.tables.has(t)) {
        score += TABLE_WEIGHT;
        shared.push(t);
      }
    }

    for (const cls of sig.classes) {
      if (sourceSig.classes.has(cls)) {
        score += CLASS_WEIGHT;
        shared.push(cls);
      }
    }

    if (score > 0) {
      scored.push({
        appmap_name: sig.name,
        score,
        method: sig.method,
        route: sig.route,
        status_code: sig.status_code,
        elapsed_ms: sig.elapsed_ms,
        shared,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const limit = filter.limit ?? DEFAULT_PAGE_LIMIT;
  const offset = filter.offset ?? 0;
  const total = scored.length;
  const sliced = limit > 0 ? scored.slice(offset, offset + limit) : scored.slice(offset);
  return { rows: sliced, total, limit, offset };
}
