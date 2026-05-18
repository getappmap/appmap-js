import {
  ExceptionNode,
  FunctionNode,
  HttpClientNode,
  HttpServerNode,
  LogNode,
  SqlNode,
  TreeNode,
  TreeSummary,
} from '../queries/tree';
import { formatCount, formatMs, formatTable } from './format';
import { projectLogMessage } from './logMessage';

const INDENT = '  ';

// Render the full tree. Each event is one line; depth maps to indentation.
// Format mirrors V3:
//   HTTP→  POST /orders → HTTP 500 [520ms]
//     CALL  app/.../OrdersController#create [519ms]
//     SQL   INSERT INTO orders (...) [14ms]
//     EXC   IntegrityError: duplicate key
//     HTTP← GET https://api.example/v1 → 200 [40ms]
export function renderTree(nodes: readonly TreeNode[]): string {
  return nodes.map(renderTreeLine).join('\n');
}

function renderTreeLine(node: TreeNode): string {
  const indent = INDENT.repeat(node.depth);
  switch (node.kind) {
    case 'http_server':
      return `${indent}HTTP→  ${renderHttpServer(node)}`;
    case 'http_client':
      return `${indent}HTTP←  ${renderHttpClient(node)}`;
    case 'function':
      return `${indent}CALL   ${renderFunction(node)}`;
    case 'sql':
      return `${indent}SQL    ${renderSql(node)}`;
    case 'exception':
      return `${indent}EXC    ${renderException(node)}`;
    case 'log':
      return `${indent}LOG    ${renderLog(node)}`;
  }
}

function renderException(n: ExceptionNode): string {
  const where = n.path ? ` @ ${n.path}${n.lineno != null ? `:${n.lineno}` : ''}` : '';
  return `${n.exception_class}${n.message ? `: ${n.message}` : ''}${where}`;
}

function renderHttpServer(n: HttpServerNode): string {
  return `${n.method} ${n.route} → HTTP ${n.status_code} ${bracket(n.elapsed_ms)}`.trim();
}

function renderHttpClient(n: HttpClientNode): string {
  const status = n.status_code != null ? ` → ${n.status_code}` : '';
  return `${n.method} ${n.url}${status} ${bracket(n.elapsed_ms)}`.trim();
}

function renderFunction(n: FunctionNode): string {
  const id = n.fqid ?? `${n.defined_class}${n.is_static ? '.' : '#'}${n.method_id}`;
  const ret = n.return_value != null ? `  → ${n.return_value}` : '';
  return `${id} ${bracket(n.elapsed_ms)}${ret}`.trim();
}

function renderSql(n: SqlNode): string {
  return `${truncate(n.sql_text, 120)} ${bracket(n.elapsed_ms)}`.trim();
}

function renderLog(n: LogNode): string {
  const message = projectLogMessage(n.parameters_json, n.return_value);
  const prefix = `${n.logger}.${n.method_id}`;
  return message ? `${prefix}: ${truncate(message, 120)}` : prefix;
}

function bracket(ms: number | null): string {
  return ms == null ? '' : `[${formatMs(ms)}]`;
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

// Dense one-line-per-event rendering for MCP responses. Each line starts
// with the event_id (so the agent can drill via find_calls/find_queries)
// and includes file:line for source-reading without a follow-up call.
// Carries a truncated return value inline — the cheapest evidence that
// distinguishes sibling calls (e.g. two builders stamping different
// timestamps) — but drops parameters; agents query specific event_ids
// or `format=json` for full, untruncated detail.
export function renderTreeForMcp(nodes: readonly TreeNode[]): string {
  return nodes.map(renderTreeLineForMcp).join('\n');
}

function renderTreeLineForMcp(node: TreeNode): string {
  const indent = INDENT.repeat(node.depth);
  const id = `#${node.event_id}`;
  switch (node.kind) {
    case 'http_server':
      return `${indent}${id} HTTP→ ${renderHttpServer(node)}`;
    case 'http_client':
      return `${indent}${id} HTTP← ${renderHttpClient(node)}`;
    case 'function':
      return `${indent}${id} CALL  ${renderFunctionForMcp(node)}`;
    case 'sql':
      return `${indent}${id} SQL   ${renderSql(node)}`;
    case 'exception':
      return `${indent}${id} EXC   ${renderException(node)}`;
    case 'log':
      return `${indent}${id} LOG   ${renderLog(node)}`;
  }
}

// Return values are truncated to 120 chars — matching renderSql's budget.
// Java/Ruby record-style toString()s front-load their fields, so the
// distinguishing value (an id, a timestamp, a status) survives the cut.
const MCP_RETURN_VALUE_CHARS = 120;

function renderFunctionForMcp(n: FunctionNode): string {
  const id = n.fqid ?? `${n.defined_class}${n.is_static ? '.' : '#'}${n.method_id}`;
  const where =
    n.path != null ? ` (${n.path}${n.lineno != null ? `:${n.lineno}` : ''})` : '';
  const ret =
    n.return_value != null
      ? `  → ${truncate(n.return_value, MCP_RETURN_VALUE_CHARS)}`
      : '';
  return `${id}${where} ${bracket(n.elapsed_ms)}${ret}`.trim();
}

export interface BudgetedRenderResult {
  tree: string;
  rendered_events: number;
  clipped_events: number;
  clipped_bytes: number;
  cutoff_depth: number;       // last depth fully rendered (-1 if no depth fully fit)
  partial_depth: number;      // depth at which partial fill happened (-1 if none)
  bytes_used: number;
}

// Byte-budgeted breadth-first rendering. Fills the budget level-by-level
// (all of depth 0, then all of depth 1, ...); when an entire layer
// doesn't fit, partial-fills that layer in event_id order. Subtrees
// whose descendants were clipped get an inline marker showing the
// clipped count + bytes so the agent knows where to drill.
export function renderTreeForMcpBudgeted(
  nodes: readonly TreeNode[],
  budget: number
): BudgetedRenderResult {
  if (nodes.length === 0) {
    return {
      tree: '',
      rendered_events: 0,
      clipped_events: 0,
      clipped_bytes: 0,
      cutoff_depth: -1,
      partial_depth: -1,
      bytes_used: 0,
    };
  }

  // Dedupe by event_id: the upstream tree query emits separate rows for
  // a function call and the exception it threw (same event_id). For
  // breadth-first byte accounting we want one node per event_id, so
  // collapse to a deterministic representative — first occurrence wins.
  const seen = new Set<number>();
  const dedupedNodes: TreeNode[] = [];
  for (const n of nodes) {
    if (seen.has(n.event_id)) continue;
    seen.add(n.event_id);
    dedupedNodes.push(n);
  }

  const byId = new Map<number, TreeNode>();
  const childrenOf = new Map<number, number[]>();
  const roots: number[] = [];
  const lineFor = new Map<number, string>();
  const lineBytes = new Map<number, number>();
  const nodesAtDepth = new Map<number, number[]>();
  let maxDepth = 0;

  for (const n of dedupedNodes) {
    byId.set(n.event_id, n);
    const line = renderTreeLineForMcp(n);
    lineFor.set(n.event_id, line);
    lineBytes.set(n.event_id, line.length + 1);
    if (n.depth > maxDepth) maxDepth = n.depth;
    const dArr = nodesAtDepth.get(n.depth) ?? [];
    dArr.push(n.event_id);
    nodesAtDepth.set(n.depth, dArr);
  }
  for (const arr of nodesAtDepth.values()) arr.sort((a, b) => a - b);

  for (const n of dedupedNodes) {
    if (n.parent_event_id !== null && byId.has(n.parent_event_id)) {
      const arr = childrenOf.get(n.parent_event_id) ?? [];
      arr.push(n.event_id);
      childrenOf.set(n.parent_event_id, arr);
    } else {
      roots.push(n.event_id);
    }
  }
  for (const arr of childrenOf.values()) arr.sort((a, b) => a - b);
  roots.sort((a, b) => a - b);

  // Reserve roughly 80 bytes per potential clip marker. One marker per
  // node at the cutoff depth that has children; we don't know which
  // yet, so reserve based on node count at cutoff candidates.
  const MARKER_RESERVE_PER = 80;

  // Cumulative line bytes through each depth.
  const bytesThroughDepth: number[] = [];
  let cum = 0;
  for (let d = 0; d <= maxDepth; d++) {
    for (const id of nodesAtDepth.get(d) ?? []) cum += lineBytes.get(id) ?? 0;
    bytesThroughDepth[d] = cum;
  }

  // Pick the deepest D such that depth-≤D fits, leaving room for clip
  // markers under each depth-D node that still has children at D+1.
  let cutoff = -1;
  for (let d = 0; d <= maxDepth; d++) {
    const parentsWithKids = (nodesAtDepth.get(d) ?? []).filter(
      (id) => (childrenOf.get(id) ?? []).length > 0
    ).length;
    const projected = bytesThroughDepth[d] + parentsWithKids * MARKER_RESERVE_PER;
    if (projected <= budget) cutoff = d;
    else break;
  }

  const rendered = new Set<number>();
  // All events through cutoff depth are rendered.
  for (let d = 0; d <= cutoff; d++) {
    for (const id of nodesAtDepth.get(d) ?? []) rendered.add(id);
  }

  // Partial fill at cutoff+1 in event_id order while residual budget
  // permits. The cutoff projection already accounted for cutoff-layer
  // marker reserve, but we don't subtract it here a second time — that
  // would shut partial fill off in the squeezed zone where cutoff
  // barely fits.  The trade-off is a small (≤ markers × ~80 bytes)
  // over-budget slop in the final rendered size; agents see this in
  // `bytes_used` and can re-request with a lower max_chars if needed.
  let partialDepth = -1;
  const bytesUsedThroughCutoff = cutoff >= 0 ? bytesThroughDepth[cutoff] : 0;
  let residual = budget - bytesUsedThroughCutoff;
  if (cutoff + 1 <= maxDepth) {
    const partialCandidates = nodesAtDepth.get(cutoff + 1) ?? [];
    for (const id of partialCandidates) {
      const lb = lineBytes.get(id) ?? 0;
      // Reserve marker cost for this event's potential subtree clip too.
      const hasKids = (childrenOf.get(id) ?? []).length > 0;
      const cost = lb + (hasKids ? MARKER_RESERVE_PER : 0);
      if (cost <= residual) {
        rendered.add(id);
        residual -= cost;
        if (partialDepth === -1) partialDepth = cutoff + 1;
      } else {
        break;
      }
    }
  }

  // If no depth-0 events fit, emit at least one as best-effort so the
  // agent sees something. Mark the rest clipped.
  if (cutoff === -1 && rendered.size === 0 && roots.length > 0) {
    rendered.add(roots[0]);
  }

  // Pre-compute per-node "all-descendant" totals for fast clip math.
  const allDescendantCount = new Map<number, number>();
  const allDescendantBytes = new Map<number, number>();
  function computeTotals(id: number): { count: number; bytes: number } {
    let c = 0;
    let b = 0;
    for (const k of childrenOf.get(id) ?? []) {
      const sub = computeTotals(k);
      c += 1 + sub.count;
      b += (lineBytes.get(k) ?? 0) + sub.bytes;
    }
    allDescendantCount.set(id, c);
    allDescendantBytes.set(id, b);
    return { count: c, bytes: b };
  }
  for (const r of roots) computeTotals(r);

  // Walk DFS preorder, emit rendered lines, emit a clip marker beneath a
  // node when any of its descendants is unrendered.
  const out: string[] = [];
  let clippedEvents = 0;
  let clippedBytes = 0;

  // For clip-marker totals, count only direct unrendered children (and
  // their subtrees) — not transitive ones that already produced their
  // own marker beneath an inner rendered node. This avoids the same
  // clip being reported at every ancestor in a linear chain.
  function directlyClippedSubtree(id: number): { count: number; bytes: number } {
    let c = 0;
    let b = 0;
    for (const k of childrenOf.get(id) ?? []) {
      if (!rendered.has(k)) {
        c += 1 + (allDescendantCount.get(k) ?? 0);
        b += (lineBytes.get(k) ?? 0) + (allDescendantBytes.get(k) ?? 0);
      }
    }
    return { count: c, bytes: b };
  }

  function walk(id: number): void {
    if (!rendered.has(id)) return;
    out.push(lineFor.get(id) ?? '');
    for (const k of childrenOf.get(id) ?? []) walk(k);
    const clip = directlyClippedSubtree(id);
    if (clip.count > 0) {
      const node = byId.get(id);
      const childDepth = (node?.depth ?? 0) + 1;
      const indent = INDENT.repeat(childDepth);
      out.push(
        `${indent}... [clipped: ${clip.count} events, ${clip.bytes} bytes; drill via child_depth=${childDepth + 1} or focus on #${id}]`
      );
    }
  }

  for (const r of roots) walk(r);

  // Top-level totals: total events - rendered = clipped.
  let totalBytes = 0;
  for (const lb of lineBytes.values()) totalBytes += lb;
  let renderedBytes = 0;
  for (const id of rendered) renderedBytes += lineBytes.get(id) ?? 0;
  clippedEvents = dedupedNodes.length - rendered.size;
  clippedBytes = totalBytes - renderedBytes;

  const tree = out.join('\n');
  return {
    tree,
    rendered_events: rendered.size,
    clipped_events: clippedEvents,
    clipped_bytes: clippedBytes,
    cutoff_depth: cutoff,
    partial_depth: partialDepth,
    bytes_used: tree.length,
  };
}

// Flat rendering — used by --filter=sql and --filter=http (no indentation,
// just the matching events in order).
export function renderFlat(nodes: readonly TreeNode[]): string {
  return nodes
    .map((n) => {
      switch (n.kind) {
        case 'http_server':
          return `HTTP→  ${renderHttpServer(n)}`;
        case 'http_client':
          return `HTTP←  ${renderHttpClient(n)}`;
        case 'sql':
          return `SQL    ${renderSql(n)}`;
        case 'function':
          return `CALL   ${renderFunction(n)}`;
        case 'exception':
          return `EXC    ${renderException(n)}`;
        case 'log':
          return `LOG    ${renderLog(n)}`;
      }
    })
    .join('\n');
}

// Summary format: per V3, a one-screen overview without the tree.
//   ENTRY      POST /orders → 500 [520ms]
//   SQL        3 queries, 19ms total
//   EXCEPTION  IntegrityError
//   LABELS     log×2, dao×3, security.idempotency×1
export function renderSummary(s: TreeSummary): string {
  const rows: [string, string][] = [];

  if (s.entry) {
    rows.push([
      'ENTRY',
      `${s.entry.method} ${s.entry.route} → ${s.entry.status_code} ${bracket(s.entry.elapsed_ms)}`,
    ]);
  }

  if (s.sql.count > 0) {
    rows.push([
      'SQL',
      `${formatCount(s.sql.count)} quer${s.sql.count === 1 ? 'y' : 'ies'}, ${formatMs(s.sql.total_ms)} total`,
    ]);
  }

  if (s.http_client.count > 0) {
    rows.push([
      'HTTP→OUT',
      `${formatCount(s.http_client.count)} request${s.http_client.count === 1 ? '' : 's'}, ${formatMs(s.http_client.total_ms)} total`,
    ]);
  }

  for (const e of s.exceptions) {
    const where = e.path ? ` @ ${e.path}${e.lineno != null ? `:${e.lineno}` : ''}` : '';
    rows.push([
      'EXCEPTION',
      e.exception_class + (e.message ? `: ${e.message}` : '') + where,
    ]);
  }

  if (s.labels.length > 0) {
    const text = s.labels.map((l) => `${l.label}×${l.count}`).join(', ');
    rows.push(['LABELS', text]);
  }

  return formatTable(['', ''], rows);
}
