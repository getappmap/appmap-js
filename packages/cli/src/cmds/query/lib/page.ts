import sqlite3 from 'better-sqlite3';

// Standard wrapper for any list-returning query. `rows` is the slice
// the caller asked for; `total` is the count of all matching rows
// (ignoring limit/offset). JSON consumers get truncation info for free;
// text renderers append a footer when total > offset + rows.length.
export interface Page<T> {
  rows: T[];
  total: number;
  limit: number;
  offset: number;
}

// Default limit applied when filter.limit is undefined. Pass 0 or
// negative to mean unbounded.
export const DEFAULT_PAGE_LIMIT = 20;

// Run a base query and return its paginated result + total count.
// `baseSql` is the SELECT (with WHERE / ORDER BY) without LIMIT/OFFSET;
// the function wraps it in a COUNT subquery for the total. Limit/offset
// are inlined as numbers — they come from typed filter fields, not
// arbitrary user input, so this is safe.
export function paginate<T>(
  db: sqlite3.Database,
  baseSql: string,
  params: readonly (string | number)[],
  options: { limit?: number; offset?: number } = {}
): Page<T> {
  const limit = options.limit ?? DEFAULT_PAGE_LIMIT;
  const offset = options.offset ?? 0;

  const countSql = `SELECT COUNT(*) AS n FROM (${baseSql})`;
  const total = (db.prepare(countSql).get(...params) as { n: number }).n;

  let rowsSql = baseSql;
  if (limit > 0) {
    rowsSql += ` LIMIT ${limit | 0} OFFSET ${offset | 0}`;
  } else if (offset > 0) {
    rowsSql += ` LIMIT -1 OFFSET ${offset | 0}`;
  }
  const rows = db.prepare(rowsSql).all(...params) as T[];

  return { rows, total, limit, offset };
}

// Format the truncation footer for text-mode renderers. Returns null
// when nothing was clipped (so the caller can choose whether to print
// it at all).
export function truncationFooter(page: Page<unknown>): string | null {
  const shown = page.rows.length;
  if (shown === 0 && page.total === 0) return null;
  const last = page.offset + shown;
  if (last >= page.total) return null;
  const first = page.offset + 1;
  return `(showing ${first}–${last} of ${page.total}; use --limit / --offset to page)`;
}
