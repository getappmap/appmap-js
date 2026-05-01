import {
  FunctionNode,
  HttpClientNode,
  HttpServerNode,
  SqlNode,
  TreeNode,
  TreeSummary,
} from '../queries/tree';
import { formatCount, formatMs, formatTable } from './format';

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
      return `${indent}EXC    ${node.exception_class}${
        node.message ? `: ${node.message}` : ''
      }`;
  }
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

function bracket(ms: number | null): string {
  return ms == null ? '' : `[${formatMs(ms)}]`;
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
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
          return `EXC    ${n.exception_class}${n.message ? `: ${n.message}` : ''}`;
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
    rows.push(['EXCEPTION', e.exception_class + (e.message ? `: ${e.message}` : '')]);
  }

  if (s.labels.length > 0) {
    const text = s.labels.map((l) => `${l.label}×${l.count}`).join(', ');
    rows.push(['LABELS', text]);
  }

  return formatTable(['', ''], rows);
}
