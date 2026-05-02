import sqlite3 from 'better-sqlite3';

import { appmapRefClause } from '../lib/scope';

// Discriminated union of tree nodes. Each node corresponds to one row in
// one of the per-event tables; `depth` is computed from parent_event_id
// chains within the same recording.

interface BaseNode {
  event_id: number;
  parent_event_id: number | null;
  thread_id: number | null;
  depth: number;
}

export interface HttpServerNode extends BaseNode {
  kind: 'http_server';
  method: string;
  route: string;
  status_code: number;
  elapsed_ms: number | null;
}

export interface HttpClientNode extends BaseNode {
  kind: 'http_client';
  method: string;
  url: string;
  status_code: number | null;
  elapsed_ms: number | null;
}

export interface SqlNode extends BaseNode {
  kind: 'sql';
  sql_text: string;
  database_type: string | null;
  elapsed_ms: number | null;
}

export interface FunctionNode extends BaseNode {
  kind: 'function';
  fqid: string | null;
  defined_class: string;
  method_id: string;
  is_static: boolean;
  elapsed_ms: number | null;
  parameters_json: string | null;
  return_value: string | null;
}

export interface ExceptionNode extends BaseNode {
  kind: 'exception';
  exception_class: string;
  message: string | null;
  path: string | null;
  lineno: number | null;
}

export type TreeNode =
  | HttpServerNode
  | HttpClientNode
  | SqlNode
  | FunctionNode
  | ExceptionNode;

export interface AppmapInfo {
  id: number;
  name: string;
  source_path: string;
}

// Resolve a user-supplied appmap reference (name or source-path basename) to
// the row in `appmaps`. Throws on miss or ambiguity (returns candidates in
// the message so the user can disambiguate).
export function resolveAppmap(db: sqlite3.Database, ref: string): AppmapInfo {
  const m = appmapRefClause(ref, 'a');
  const rows = db
    .prepare(
      `SELECT a.id, a.name, a.source_path FROM appmaps a
       WHERE ${m.sql}
       ORDER BY a.source_path`
    )
    .all(...m.params) as AppmapInfo[];
  if (rows.length === 0) throw new Error(`appmap not found: ${ref}`);
  if (rows.length > 1) {
    const list = rows.map((r) => `  - ${r.source_path}`).join('\n');
    throw new Error(`appmap "${ref}" is ambiguous; matches:\n${list}`);
  }
  return rows[0];
}

export interface TreeOptions {
  // Focus criteria — multiple may be supplied; results are the union of
  // matches' neighborhoods. Without any focus, the full tree is returned.
  focusFn?: string;       // exact code_object fqid
  focusSql?: string;      // case-insensitive substring of sql_text
  focusRoute?: string;    // normalized_path (or raw path) of a server request
  focusUrl?: string;      // case-insensitive substring of an outbound URL

  // Depth budgets, in effect only when focus is active.
  ancestors?: number;     // ancestor levels to keep above each match (default 5)
  descendants?: number;   // descendant levels below each match (default 3)

  // Prune subtrees whose maximum elapsed time is below this threshold —
  // useful for trimming traces dominated by fast leaf calls.
  minElapsedMs?: number;
}

const DEFAULT_ANCESTORS = 5;
const DEFAULT_DESCENDANTS = 3;

// Build the flat-but-depth-annotated tree for a recording. Events are
// returned in event_id order; consumers can render with indentation.
export function tree(
  db: sqlite3.Database,
  appmapRef: string,
  options: TreeOptions = {}
): TreeNode[] {
  const am = resolveAppmap(db, appmapRef);
  const events: TreeNode[] = [];

  for (const r of db
    .prepare(
      `SELECT event_id, parent_event_id, thread_id, method,
              COALESCE(normalized_path, path) AS route, status_code, elapsed_ms
       FROM http_requests WHERE appmap_id = ?`
    )
    .all(am.id) as {
    event_id: number;
    parent_event_id: number | null;
    thread_id: number | null;
    method: string;
    route: string;
    status_code: number;
    elapsed_ms: number | null;
  }[]) {
    events.push({
      kind: 'http_server',
      event_id: r.event_id,
      parent_event_id: r.parent_event_id,
      thread_id: r.thread_id,
      depth: 0,
      method: r.method,
      route: r.route,
      status_code: r.status_code,
      elapsed_ms: r.elapsed_ms,
    });
  }

  for (const r of db
    .prepare(
      `SELECT event_id, parent_event_id, thread_id, method, url, status_code, elapsed_ms
       FROM http_client_requests WHERE appmap_id = ?`
    )
    .all(am.id) as {
    event_id: number;
    parent_event_id: number | null;
    thread_id: number | null;
    method: string;
    url: string;
    status_code: number | null;
    elapsed_ms: number | null;
  }[]) {
    events.push({
      kind: 'http_client',
      event_id: r.event_id,
      parent_event_id: r.parent_event_id,
      thread_id: r.thread_id,
      depth: 0,
      method: r.method,
      url: r.url,
      status_code: r.status_code,
      elapsed_ms: r.elapsed_ms,
    });
  }

  for (const r of db
    .prepare(
      `SELECT event_id, parent_event_id, thread_id, sql_text, database_type, elapsed_ms
       FROM sql_queries WHERE appmap_id = ?`
    )
    .all(am.id) as {
    event_id: number;
    parent_event_id: number | null;
    thread_id: number | null;
    sql_text: string;
    database_type: string | null;
    elapsed_ms: number | null;
  }[]) {
    events.push({
      kind: 'sql',
      event_id: r.event_id,
      parent_event_id: r.parent_event_id,
      thread_id: r.thread_id,
      depth: 0,
      sql_text: r.sql_text,
      database_type: r.database_type,
      elapsed_ms: r.elapsed_ms,
    });
  }

  for (const r of db
    .prepare(
      `SELECT fc.event_id, fc.parent_event_id, fc.thread_id,
              co.fqid AS fqid, fc.defined_class, fc.method_id,
              fc.is_static, fc.elapsed_ms, fc.parameters_json, fc.return_value
       FROM function_calls fc
       LEFT JOIN code_objects co ON co.id = fc.code_object_id
       WHERE fc.appmap_id = ?`
    )
    .all(am.id) as {
    event_id: number;
    parent_event_id: number | null;
    thread_id: number | null;
    fqid: string | null;
    defined_class: string;
    method_id: string;
    is_static: number;
    elapsed_ms: number | null;
    parameters_json: string | null;
    return_value: string | null;
  }[]) {
    events.push({
      kind: 'function',
      event_id: r.event_id,
      parent_event_id: r.parent_event_id,
      thread_id: r.thread_id,
      depth: 0,
      fqid: r.fqid,
      defined_class: r.defined_class,
      method_id: r.method_id,
      is_static: r.is_static === 1,
      elapsed_ms: r.elapsed_ms,
      parameters_json: r.parameters_json,
      return_value: r.return_value,
    });
  }

  for (const r of db
    .prepare(
      `SELECT event_id, parent_event_id, thread_id, exception_class, message,
              path, lineno
       FROM exceptions WHERE appmap_id = ?`
    )
    .all(am.id) as {
    event_id: number;
    parent_event_id: number | null;
    thread_id: number | null;
    exception_class: string;
    message: string | null;
    path: string | null;
    lineno: number | null;
  }[]) {
    events.push({
      kind: 'exception',
      event_id: r.event_id,
      parent_event_id: r.parent_event_id,
      thread_id: r.thread_id,
      depth: 0,
      exception_class: r.exception_class,
      message: r.message,
      path: r.path,
      lineno: r.lineno,
    });
  }

  events.sort((a, b) => a.event_id - b.event_id);
  computeDepths(events);

  let result = events;
  if (hasFocus(options)) {
    result = applyFocus(result, options);
  }
  if (options.minElapsedMs && options.minElapsedMs > 0) {
    result = pruneByElapsed(result, options.minElapsedMs);
  }
  // Re-anchor depth to the highest included ancestor in the surviving
  // set, so the rendered indentation starts at column 0 instead of
  // floating wherever the original absolute depth happened to be.
  if (result !== events) recomputeDepthsRelative(result);

  return result;
}

function computeDepths(events: TreeNode[]): void {
  // Events are sorted by event_id; parents always precede children, so a
  // single forward pass suffices.
  const depthByEventId = new Map<number, number>();
  for (const ev of events) {
    let depth = 0;
    if (ev.parent_event_id !== null) {
      const p = depthByEventId.get(ev.parent_event_id);
      if (p !== undefined) depth = p + 1;
    }
    ev.depth = depth;
    depthByEventId.set(ev.event_id, depth);
  }
}

function recomputeDepthsRelative(events: readonly TreeNode[]): void {
  const includedIds = new Set(events.map((e) => e.event_id));
  const eventsByEventId = new Map<number, TreeNode>();
  for (const e of events) {
    if (!eventsByEventId.has(e.event_id)) eventsByEventId.set(e.event_id, e);
  }
  for (const e of events) {
    let d = 0;
    let pid = e.parent_event_id;
    while (pid !== null && includedIds.has(pid)) {
      d += 1;
      const parent = eventsByEventId.get(pid);
      if (!parent) break;
      pid = parent.parent_event_id;
    }
    e.depth = d;
  }
}

function hasFocus(options: TreeOptions): boolean {
  return !!(options.focusFn || options.focusSql || options.focusRoute || options.focusUrl);
}

function matchesFocus(node: TreeNode, options: TreeOptions): boolean {
  if (options.focusFn && node.kind === 'function') {
    return node.fqid === options.focusFn;
  }
  if (options.focusSql && node.kind === 'sql') {
    return node.sql_text.toLowerCase().includes(options.focusSql.toLowerCase());
  }
  if (options.focusRoute && node.kind === 'http_server') {
    return node.route === options.focusRoute;
  }
  if (options.focusUrl && node.kind === 'http_client') {
    return node.url.toLowerCase().includes(options.focusUrl.toLowerCase());
  }
  return false;
}

// Filter `events` to a neighborhood around the focus matches:
//   - the matches themselves
//   - up to `ancestors` parent levels above each match
//   - the direct children of each ancestor (so siblings of the match are visible)
//   - up to `descendants` levels below each match
function applyFocus(events: readonly TreeNode[], options: TreeOptions): TreeNode[] {
  const ancestorBudget = options.ancestors ?? DEFAULT_ANCESTORS;
  const descendantBudget = options.descendants ?? DEFAULT_DESCENDANTS;

  // Build helpers. Multiple TreeNodes can share an event_id (e.g. a call
  // event can also have an exception attached), so children are keyed
  // by event_id and we dedupe.
  const nodeByEventId = new Map<number, TreeNode>();
  for (const e of events) {
    if (!nodeByEventId.has(e.event_id)) nodeByEventId.set(e.event_id, e);
  }
  const childrenByParent = new Map<number, Set<number>>();
  for (const e of events) {
    if (e.parent_event_id !== null) {
      let bucket = childrenByParent.get(e.parent_event_id);
      if (!bucket) {
        bucket = new Set();
        childrenByParent.set(e.parent_event_id, bucket);
      }
      bucket.add(e.event_id);
    }
  }

  const focusIds = new Set<number>();
  for (const e of events) {
    if (matchesFocus(e, options)) focusIds.add(e.event_id);
  }
  if (focusIds.size === 0) return [];

  const included = new Set<number>();
  for (const fid of focusIds) {
    included.add(fid);

    // Walk up to `ancestorBudget` ancestors; record them and remember the
    // path so we can include their direct children.
    const ancestorIds: number[] = [];
    let cur = fid;
    for (let i = 0; i < ancestorBudget; i++) {
      const node = nodeByEventId.get(cur);
      if (!node || node.parent_event_id === null) break;
      const parentId = node.parent_event_id;
      if (!nodeByEventId.has(parentId)) break;
      ancestorIds.push(parentId);
      included.add(parentId);
      cur = parentId;
    }
    // Direct children of every ancestor (so the focus's siblings — and
    // siblings of every node on the path to root — are visible).
    for (const aid of ancestorIds) {
      const kids = childrenByParent.get(aid);
      if (kids) for (const k of kids) included.add(k);
    }

    // Descendants up to `descendantBudget` levels (BFS).
    const queue: { id: number; depth: number }[] = [{ id: fid, depth: 0 }];
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) break;
      if (next.depth >= descendantBudget) continue;
      const kids = childrenByParent.get(next.id);
      if (!kids) continue;
      for (const k of kids) {
        if (!included.has(k)) {
          included.add(k);
          queue.push({ id: k, depth: next.depth + 1 });
        }
      }
    }
  }

  return events.filter((e) => included.has(e.event_id));
}

// Prune subtrees whose entire branch's maximum elapsed_ms is below the
// threshold. A node is kept iff it (or any of its descendants) has an
// elapsed_ms ≥ threshold. Events without elapsed (exceptions, http
// requests with no return) are kept iff their owning subtree qualifies.
function pruneByElapsed(events: readonly TreeNode[], minMs: number): TreeNode[] {
  const childrenByParent = new Map<number, Set<number>>();
  for (const e of events) {
    if (e.parent_event_id !== null) {
      let bucket = childrenByParent.get(e.parent_event_id);
      if (!bucket) {
        bucket = new Set();
        childrenByParent.set(e.parent_event_id, bucket);
      }
      bucket.add(e.event_id);
    }
  }
  const elapsedById = new Map<number, number>();
  for (const e of events) {
    const cur = elapsedById.get(e.event_id) ?? 0;
    const here = 'elapsed_ms' in e && typeof e.elapsed_ms === 'number' ? e.elapsed_ms : 0;
    if (here > cur) elapsedById.set(e.event_id, here);
  }
  const maxByEventId = new Map<number, number>();
  function maxFor(id: number): number {
    const cached = maxByEventId.get(id);
    if (cached !== undefined) return cached;
    let m = elapsedById.get(id) ?? 0;
    const kids = childrenByParent.get(id);
    if (kids) for (const k of kids) m = Math.max(m, maxFor(k));
    maxByEventId.set(id, m);
    return m;
  }
  return events.filter((e) => maxFor(e.event_id) >= minMs);
}

export interface TreeSummary {
  appmap_name: string;
  source_path: string;
  entry: { method: string; route: string; status_code: number; elapsed_ms: number | null } | null;
  sql: { count: number; total_ms: number };
  http_client: { count: number; total_ms: number };
  exceptions: {
    exception_class: string;
    message: string | null;
    path: string | null;
    lineno: number | null;
  }[];
  labels: { label: string; count: number }[];
}

export function treeSummary(db: sqlite3.Database, appmapRef: string): TreeSummary {
  const am = resolveAppmap(db, appmapRef);
  const nodes = tree(db, appmapRef);

  const httpServer = nodes.find((n): n is HttpServerNode => n.kind === 'http_server');
  const sqls = nodes.filter((n): n is SqlNode => n.kind === 'sql');
  const httpClients = nodes.filter((n): n is HttpClientNode => n.kind === 'http_client');
  const excs = nodes.filter((n): n is ExceptionNode => n.kind === 'exception');

  const labelRows = db
    .prepare(
      `SELECT l.label, COUNT(*) AS n
       FROM function_calls fc
       JOIN labels l ON l.code_object_id = fc.code_object_id
       WHERE fc.appmap_id = ?
       GROUP BY l.label
       ORDER BY n DESC, l.label`
    )
    .all(am.id) as { label: string; n: number }[];

  return {
    appmap_name: am.name,
    source_path: am.source_path,
    entry: httpServer
      ? {
          method: httpServer.method,
          route: httpServer.route,
          status_code: httpServer.status_code,
          elapsed_ms: httpServer.elapsed_ms,
        }
      : null,
    sql: {
      count: sqls.length,
      total_ms: sqls.reduce((s, q) => s + (q.elapsed_ms ?? 0), 0),
    },
    http_client: {
      count: httpClients.length,
      total_ms: httpClients.reduce((s, c) => s + (c.elapsed_ms ?? 0), 0),
    },
    exceptions: excs.map((e) => ({
      exception_class: e.exception_class,
      message: e.message,
      path: e.path,
      lineno: e.lineno,
    })),
    labels: labelRows.map((r) => ({ label: r.label, count: r.n })),
  };
}
