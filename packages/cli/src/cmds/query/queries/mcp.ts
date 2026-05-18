// MCP (Model Context Protocol) handler. Exposes the V3 query surface as
// MCP tools and resources.
//
// Tool names are LLM-readable and uniquely identify what each tool
// returns: `find_*` returns row-level matches, `function_hotspots` /
// `sql_hotspots` return rankings, `get_call_tree` returns one recording's
// tree, etc. Mirrors V3's CLI verbs but with descriptive names rather
// than the terse single-noun forms the CLI uses.
//
// Wire format: newline-delimited JSON-RPC 2.0 over stdio. This module
// implements the message dispatch logic only; the stdio loop lives in
// the verb so this file stays testable without process I/O.

import sqlite3 from 'better-sqlite3';

import { compare, type CompareSort } from './compare';
import { endpoints, EndpointSort, EndpointsFilter } from './endpoints';
import {
  FindAppmapRow,
  FindCallRow,
  FindExceptionRow,
  FindFilter,
  FindLogRow,
  FindQueryRow,
  FindRequestRow,
  find,
} from './find';
import { hotspots } from './hotspots';
import { related, RelatedFilter } from './related';
import { FunctionNode, TreeNode, treeWithMeta, TreeOptions } from './tree';
import { Page } from '../lib/page';
import { parseDuration, parseStatus, parseTime } from '../lib/parseFilter';
import { decorateRecording, resolveAppmapPath } from '../lib/recordingId';
import { suggestSimilarFunctionIds } from '../lib/suggestSimilarFunctionIds';
import { renderTreeForMcp, renderTreeForMcpBudgeted } from '../lib/treeRender';

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface ToolSpec {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// Per-handler context. Only the DB handle for now; kept as an object
// so future cross-cutting state (auth tokens, logger, etc.) can attach
// without touching every tool signature.
export interface McpContext {
  db: sqlite3.Database;
}

interface ToolImpl {
  spec: ToolSpec;
  handler: (args: Record<string, unknown>, ctx: McpContext) => unknown;
}

interface ResourceSpec {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

interface ResourceImpl {
  spec: ResourceSpec;
  read: (ctx: McpContext) => unknown;
}

// Template-based resources expose a parameterized URI. The agent
// discovers them via resources/templates/list, then reads a concrete
// instance with resources/read by substituting the placeholder.
interface ResourceTemplateSpec {
  uriTemplate: string;       // RFC 6570 template
  name: string;
  description: string;
  mimeType: string;
}

interface ResourceTemplateImpl {
  spec: ResourceTemplateSpec;
  // Returns the args object if the URI matches the template, else null.
  match: (uri: string) => Record<string, string> | null;
  read: (args: Record<string, string>, ctx: McpContext) => unknown;
}

const SERVER_INFO = { name: 'appmap-query', version: '1.0.0' };
const PROTOCOL_VERSION = '2024-11-05';

// --- helpers ------------------------------------------------------------

function maybeTime(s: unknown): string | undefined {
  return typeof s === 'string' && s.length > 0 ? parseTime(s) : undefined;
}

function maybeNumber(n: unknown): number | undefined {
  if (typeof n === 'number' && Number.isFinite(n)) return n;
  if (typeof n === 'string' && /^-?\d+(\.\d+)?$/.test(n)) return Number(n);
  return undefined;
}

function maybeString(s: unknown): string | undefined {
  return typeof s === 'string' && s.length > 0 ? s : undefined;
}

class ParameterValidationError extends TypeError {}

function maybeCompareSort(s: unknown): CompareSort | undefined {
  if (s === 'delta' || s === 'p95-a' || s === 'p95-b') return s;
  if (s === undefined) return undefined;
  throw new ParameterValidationError(`invalid compare sort: ${String(s)}`);
}

// ---- get_call_tree default selection -----------------------------------
//
// Solver trajectories repeatedly burned 2–3 calls discovering tractable
// `child_depth` values: a junit recording at depth 6 would blow the
// token budget, the agent retried with focus_type=http_server_request
// (which silently returned [] on a junit recording), and only on the
// third call landed on a per-request recording where the original
// depth worked. The fix lives at the tool-defaults layer: pick a
// useful depth based on the recording's shape, fall back to a
// summary if the result still doesn't fit, and tell the agent
// explicitly what was chosen and why.

// Recordings with more events than this default to a shallow tree. The
// value is a heuristic, not a hard rule — agents can still pass
// child_depth explicitly to override. 500 separates per-request
// recordings (typically 50–300 events) from junit/process recordings
// (typically 1k+ events) in the corpus we observed.
const BROAD_EVENT_THRESHOLD = 500;

// Default child_depth used in JSON mode when an explicit value isn't
// supplied and the recording is classified as broad. Two levels keeps
// the response small enough that even a 10k-event recording stays
// within budget. Text mode uses byte-budgeted rendering instead — see
// DEFAULT_MAX_CHARS — and skips this path.
const BROAD_DEFAULT_CHILD_DEPTH = 2;

// Default byte budget for text-mode get_call_tree responses. Sized at
// roughly the p90 of historical response sizes on the omnibank corpus
// so common calls pass through whole and outliers (junit-scope
// recordings hitting deep filter/service chains) get a small clip at
// the cut sites. Agents can override by passing max_chars explicitly;
// can also force an unclipped response by passing a very large value.
const DEFAULT_MAX_CHARS = 12_000;

// When max_chars is in effect, fetch this many descendant levels from
// the DB; the renderer trims by bytes. Picked deep enough that the
// budgeted renderer has more material than it needs, but not unbounded
// — at 8 levels even pathological recordings stay query-able.
const DEEP_FETCH_DEPTH_FOR_BUDGET = 8;

// Roughly 10K tokens at ~4 chars/token. Past this, fall back to summary
// mode rather than serializing a tree the agent can't usefully process.
const RESPONSE_BUDGET_CHARS = 40_000;

// Number of expensive functions surfaced in the summary-mode drilldown
// list. Picked to give the agent a handful of starting points without
// re-blowing the budget.
const SUMMARY_DRILLDOWN_LIMIT = 10;

interface RecordingShape {
  recorder_type: string | null;
  event_count: number;
  http_request_count: number;
  sql_query_count: number;
}

function readRecordingShape(db: sqlite3.Database, appmapId: number): RecordingShape {
  const row = db
    .prepare(
      `SELECT recorder_type, event_count, http_request_count, sql_query_count
         FROM appmaps WHERE id = ?`
    )
    .get(appmapId) as RecordingShape | undefined;
  if (!row) {
    return { recorder_type: null, event_count: 0, http_request_count: 0, sql_query_count: 0 };
  }
  return row;
}

function isBroadRecording(shape: RecordingShape): boolean {
  // Per-request recordings are always narrow regardless of event count
  // (typically one entry-point, one full callstack). Anything else is
  // broad if the event count crosses the threshold. The recorder_type
  // values come from AppMap recording metadata; we recognize the common
  // single-request markers and classify the rest by size.
  const rt = (shape.recorder_type ?? '').toLowerCase();
  if (rt === 'http_server_request' || rt === 'requests' || rt === 'request') return false;
  return shape.event_count > BROAD_EVENT_THRESHOLD;
}

function buildEmptyFocusDiagnostic(focusType: string, shape: RecordingShape): string {
  const have: string[] = [];
  if (shape.http_request_count > 0) have.push(`${shape.http_request_count} http_server_request`);
  if (shape.sql_query_count > 0) have.push(`${shape.sql_query_count} sql_query`);
  if (shape.event_count > 0) have.push(`${shape.event_count} total events`);
  const recordingType = shape.recorder_type ?? 'unknown';

  // Map focus_type back to the table the user was filtering against and
  // suggest the next step that's actually likely to land. Functions are
  // the universal fallback because every recording has them.
  let suggestion: string;
  if (focusType === 'http_server_request' && shape.http_request_count === 0) {
    suggestion =
      "this recording has no HTTP server requests. Try omitting focus_type to get the full tree, " +
      "or focus_type='function' with a specific fqid.";
  } else if (focusType === 'sql_query' && shape.sql_query_count === 0) {
    suggestion =
      "this recording has no SQL queries. Try omitting focus_type to get the full tree, " +
      "or focus_type='function' with a specific fqid.";
  } else if (focusType === 'http_client_request') {
    suggestion =
      "no outbound HTTP calls matched. Try omitting focus_type, or list inbound traffic with focus_type='http_server_request'.";
  } else if (focusType === 'function') {
    suggestion =
      "no function call with that fqid. Use find_calls to discover fqids in this recording, then re-call with the exact value.";
  } else {
    suggestion = "drop focus_type to get the full tree, then re-aim with a value found in those nodes.";
  }

  const haveLine = have.length > 0 ? ` Recording contents: ${have.join(', ')}.` : '';
  return `no events of type '${focusType}' matched in this recording (recorder_type=${recordingType}).${haveLine} ${suggestion}`;
}

interface SummaryDrilldownItem {
  fqid: string | null;
  defined_class: string;
  method_id: string;
  event_id: number;
  elapsed_ms: number | null;
  child_count: number;
  path: string | null;
  lineno: number | null;
}

function buildSummaryResponse(
  meta: { nodes: TreeNode[]; truncated: boolean; max_depth_reached: number },
  chosenParams: Record<string, unknown>,
  shape: RecordingShape,
  projectedSize: number
): Record<string, unknown> {
  // Keep entry points + exceptions — the high-signal nodes the agent
  // can pivot from. Drop SQL and intermediate function calls; their
  // signal lives in the drilldown ranking instead.
  const kept = meta.nodes.filter(
    (n) => n.kind === 'http_server' || n.kind === 'http_client' || n.kind === 'exception'
  );

  // Top-N functions by elapsed_ms with a child_count so the agent can
  // judge which one is worth drilling into.
  const childCountById = new Map<number, number>();
  for (const n of meta.nodes) {
    if (n.parent_event_id !== null) {
      childCountById.set(n.parent_event_id, (childCountById.get(n.parent_event_id) ?? 0) + 1);
    }
  }
  const drilldown: SummaryDrilldownItem[] = meta.nodes
    .filter((n): n is FunctionNode => n.kind === 'function')
    .filter((n) => typeof n.elapsed_ms === 'number')
    .sort((a, b) => (b.elapsed_ms ?? 0) - (a.elapsed_ms ?? 0))
    .slice(0, SUMMARY_DRILLDOWN_LIMIT)
    .map((n) => ({
      fqid: n.fqid,
      defined_class: n.defined_class,
      method_id: n.method_id,
      event_id: n.event_id,
      elapsed_ms: n.elapsed_ms,
      child_count: childCountById.get(n.event_id) ?? 0,
      path: n.path,
      lineno: n.lineno,
    }));

  return {
    nodes: kept,
    truncated: true,
    max_depth_reached: meta.max_depth_reached,
    chosen_params: chosenParams,
    summary_mode: true,
    reason:
      `recording has ${shape.event_count} events; full tree at chosen depths would be ${projectedSize} chars ` +
      `(over the ${RESPONSE_BUDGET_CHARS}-char budget). Returned entry-points and exceptions only; ` +
      `use suggested_drilldown[].fqid with focus_type='function' to drill into specific calls.`,
    suggested_drilldown: drilldown,
  };
}

// Project the get_call_tree response according to the agent-requested
// format. `text` (default) replaces the `nodes` array with a `tree`
// string (indented one-line-per-event, prefixed with #event_id for
// drilldown). `json` returns nodes unchanged. The metadata envelope
// (chosen_params, truncated, diagnostic, etc.) is preserved in both.
// When `maxChars` is given with text format, the renderer fills the
// budget breadth-first and emits inline clip markers; the result's
// clip stats surface to the agent so it can drill if it wants more.
function projectTreeResponse(
  result: Record<string, unknown>,
  format: 'text' | 'json',
  maxChars?: number
): Record<string, unknown> {
  if (format === 'json') return result;
  const nodes = (result.nodes as TreeNode[] | undefined) ?? [];
  const { nodes: _drop, ...rest } = result;
  if (maxChars !== undefined) {
    const r = renderTreeForMcpBudgeted(nodes, maxChars);
    return {
      tree: r.tree,
      node_count: nodes.length,
      rendered_events: r.rendered_events,
      clipped_events: r.clipped_events,
      clipped_bytes: r.clipped_bytes,
      cutoff_depth: r.cutoff_depth,
      partial_depth: r.partial_depth,
      bytes_used: r.bytes_used,
      max_chars: maxChars,
      ...rest,
    };
  }
  return {
    tree: renderTreeForMcp(nodes),
    node_count: nodes.length,
    ...rest,
  };
}

// Common filter shape shared by the find_* tools and the hotspots tools.
const COMMON_FILTER_PROPERTIES: Record<string, unknown> = {
  route: {
    type: 'string',
    description:
      'Substring of the request path; optionally prefixed with an HTTP method ("POST /orders"). e.g. "orders" matches /orders, /api/orders/:id.',
  },
  status: { type: 'string', description: 'e.g. "500", ">=500", "<400".' },
  duration: { type: 'string', description: 'e.g. ">1s", ">=500ms".' },
  branch: { type: 'string', description: 'Exact branch name.' },
  commit: { type: 'string', description: 'Exact commit SHA.' },
  since: { type: 'string', description: 'ISO timestamp lower bound.' },
  until: { type: 'string', description: 'ISO timestamp upper bound.' },
  appmap: {
    type: 'string',
    description:
      'Substring of the recording name OR source_path. Any reasonable word from the basename, test method, route, etc. matches. Case-insensitive. To target a single recording unambiguously, prefer the canonical `path` field returned by find_recordings — that\'s the absolute source_path on disk and is unique by construction.',
  },
  limit: {
    type: 'integer',
    description: 'Default 20. Pass 0 for unbounded. Response includes total count.',
  },
  offset: { type: 'integer', description: 'Skip this many rows for pagination.' },
};

// Build a FindFilter from MCP tool args, parsing structured fields.
function buildFindFilter(args: Record<string, unknown>): FindFilter {
  const f: FindFilter = {};
  if (typeof args.route === 'string') f.route = args.route;
  if (typeof args.class === 'string') f.className = args.class;
  if (typeof args.method === 'string') f.method = args.method;
  if (typeof args.label === 'string') f.label = args.label;
  // event_id: an array of exact ids, or a lone scalar for convenience.
  if (Array.isArray(args.event_id)) {
    const ids = args.event_id.filter((n): n is number => typeof n === 'number');
    if (ids.length > 0) f.eventIds = ids;
  } else if (typeof args.event_id === 'number') {
    f.eventIds = [args.event_id];
  }
  if (typeof args.branch === 'string') f.branch = args.branch;
  if (typeof args.commit === 'string') f.commit = args.commit;
  if (typeof args.status === 'string') f.status = parseStatus(args.status);
  if (typeof args.duration === 'string') f.duration = parseDuration(args.duration);
  if (typeof args.appmap === 'string') f.appmap = args.appmap;
  if (typeof args.table === 'string') f.table = args.table;
  if (typeof args.exception === 'string') f.exception = args.exception;
  if (typeof args.logger === 'string') f.logger = args.logger;
  if (typeof args.message === 'string') f.message = args.message;
  const withLogs = maybeNumber(args.with_logs);
  if (withLogs !== undefined) f.withLogs = withLogs;
  f.since = maybeTime(args.since);
  f.until = maybeTime(args.until);
  f.limit = maybeNumber(args.limit);
  f.offset = maybeNumber(args.offset);
  return f;
}

// --- tools --------------------------------------------------------------

const TOOLS: ToolImpl[] = [
  // ----- aggregations ----------------------------------------------------

  {
    spec: {
      name: 'list_endpoints',
      description:
        'Per-route summary table; the first call when orienting against an unfamiliar query database. Returns Page<{method, route, count, avg_ms, p95_ms, err_pct}> = {rows, total, limit, offset}.',
      inputSchema: {
        type: 'object',
        properties: {
          branch: { type: 'string' },
          since: { type: 'string' },
          until: { type: 'string' },
          status: {
            type: 'string',
            description:
              'Route filter — e.g. ">=500". A route is shown if any request matches; aggregates remain over all of that route\'s requests.',
          },
          sort: { type: 'string', enum: ['count', 'avg', 'p95', 'err'] },
          limit: { type: 'integer' },
        },
      },
    },
    handler: (args, { db }) => {
      const f: EndpointsFilter = {};
      f.branch = maybeString(args.branch);
      f.since = maybeTime(args.since);
      f.until = maybeTime(args.until);
      if (typeof args.status === 'string') f.status = parseStatus(args.status);
      if (typeof args.sort === 'string') f.sort = args.sort as EndpointSort;
      f.limit = maybeNumber(args.limit);
      return endpoints(db, f);
    },
  },

  {
    spec: {
      name: 'function_hotspots',
      description:
        'Functions ranked by total elapsed time across recordings. Filter by `route` (scope to one entry point) or `class` (substring). path/lineno are one representative call\'s source location — read directly. fqid forms: "app/Logger#error" (instance), "app/Util.parse" (static), "module.fn" (module-level), "Outer::Inner#method" (nested).',
      inputSchema: {
        type: 'object',
        properties: {
          route: COMMON_FILTER_PROPERTIES.route,
          class: { type: 'string', description: 'Substring of class identifier; canonical fqid forms also accepted.' },
          branch: COMMON_FILTER_PROPERTIES.branch,
          since: COMMON_FILTER_PROPERTIES.since,
          until: COMMON_FILTER_PROPERTIES.until,
          limit: COMMON_FILTER_PROPERTIES.limit,
          offset: COMMON_FILTER_PROPERTIES.offset,
        },
      },
    },
    handler: (args, { db }) =>
      hotspots(db, {
        type: 'function',
        route: maybeString(args.route),
        className: maybeString(args.class),
        branch: maybeString(args.branch),
        since: maybeTime(args.since),
        until: maybeTime(args.until),
        limit: maybeNumber(args.limit),
        offset: maybeNumber(args.offset),
      }),
  },

  {
    spec: {
      name: 'sql_hotspots',
      description:
        'SQL queries ranked by total elapsed time, deduplicated by text. Returns Page<{count, avg_ms, total_ms, sql_text}> = {rows, total, limit, offset}.',
      inputSchema: {
        type: 'object',
        properties: {
          route: COMMON_FILTER_PROPERTIES.route,
          branch: COMMON_FILTER_PROPERTIES.branch,
          since: COMMON_FILTER_PROPERTIES.since,
          until: COMMON_FILTER_PROPERTIES.until,
          limit: COMMON_FILTER_PROPERTIES.limit,
          offset: COMMON_FILTER_PROPERTIES.offset,
        },
      },
    },
    handler: (args, { db }) =>
      hotspots(db, {
        type: 'sql',
        route: maybeString(args.route),
        branch: maybeString(args.branch),
        since: maybeTime(args.since),
        until: maybeTime(args.until),
        limit: maybeNumber(args.limit),
        offset: maybeNumber(args.offset),
      }),
  },

  {
    spec: {
      name: 'list_labels',
      description:
        'AppMap labels in the database, ranked by usage. Discovers what semantic anchors exist (canonical examples: "log", "security.authentication", "security.authorization", "deserialize", "system.exec") and project-specific labels (e.g. "bug.<id>"). Pass a returned label to `find_calls --label` to retrieve its calls.',
      inputSchema: { type: 'object', properties: {} },
    },
    handler: (_args, { db }) =>
      db
        .prepare(
          `SELECT l.label                  AS label,
                  COUNT(DISTINCT co.id)    AS count,
                  MIN(co.fqid)             AS sample_fqid
           FROM labels l
           JOIN code_objects co ON co.id = l.code_object_id
           GROUP BY l.label
           ORDER BY count DESC, l.label`
        )
        .all(),
  },

  // ----- row-level finders ----------------------------------------------

  {
    spec: {
      name: 'find_recordings',
      description:
        'Recording-level rows: one row per .appmap.json file with its sample request, branch, status, and counts. `appmap` filter is substring match against name and source_path. `path` is the canonical recording identifier (absolute file path on disk) — pass it back to `get_call_tree`, `find_related`, and the `--appmap` filter on other queries. `kind` ∈ {"junit" (full test), "request" (per-HTTP slice), "other"}; prefer junit for full-flow context.',
      inputSchema: {
        type: 'object',
        properties: {
          route: COMMON_FILTER_PROPERTIES.route,
          status: COMMON_FILTER_PROPERTIES.status,
          branch: COMMON_FILTER_PROPERTIES.branch,
          commit: COMMON_FILTER_PROPERTIES.commit,
          since: COMMON_FILTER_PROPERTIES.since,
          until: COMMON_FILTER_PROPERTIES.until,
          duration: COMMON_FILTER_PROPERTIES.duration,
          appmap: COMMON_FILTER_PROPERTIES.appmap,
          limit: COMMON_FILTER_PROPERTIES.limit,
          offset: COMMON_FILTER_PROPERTIES.offset,
        },
      },
    },
    handler: (args, { db }) => {
      const page = find(db, 'appmaps', buildFindFilter(args)) as Page<FindAppmapRow>;
      return {
        ...page,
        rows: page.rows.map((r) => decorateRecording(r)),
      };
    },
  },

  {
    spec: {
      name: 'find_requests',
      description:
        'Individual HTTP request rows with status, elapsed time, and the recording each came from. Filter by route (substring), status, duration, branch, time window. Returns Page<{appmap_name, event_id, method, route, status_code, elapsed_ms, branch}> = {rows, total, limit, offset}.',
      inputSchema: {
        type: 'object',
        properties: {
          route: COMMON_FILTER_PROPERTIES.route,
          status: COMMON_FILTER_PROPERTIES.status,
          duration: COMMON_FILTER_PROPERTIES.duration,
          branch: COMMON_FILTER_PROPERTIES.branch,
          commit: COMMON_FILTER_PROPERTIES.commit,
          since: COMMON_FILTER_PROPERTIES.since,
          until: COMMON_FILTER_PROPERTIES.until,
          appmap: COMMON_FILTER_PROPERTIES.appmap,
          limit: COMMON_FILTER_PROPERTIES.limit,
          offset: COMMON_FILTER_PROPERTIES.offset,
        },
      },
    },
    handler: (args, { db }) => find(db, 'requests', buildFindFilter(args)),
  },

  {
    spec: {
      name: 'find_queries',
      description:
        'SQL query rows. Filter by table (substring), caller class/method (substring), duration, route, branch. Use duration:">100ms" to find slow queries; use route to scope to a specific request. Returns Page<{appmap_name, event_id, sql_text, elapsed_ms, caller_class, caller_method}> = {rows, total, limit, offset}.',
      inputSchema: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'SQL table name (matches sql_text substring).' },
          class: { type: 'string', description: 'Caller class identifier.' },
          method: { type: 'string', description: 'Caller method name.' },
          duration: COMMON_FILTER_PROPERTIES.duration,
          route: COMMON_FILTER_PROPERTIES.route,
          status: COMMON_FILTER_PROPERTIES.status,
          branch: COMMON_FILTER_PROPERTIES.branch,
          commit: COMMON_FILTER_PROPERTIES.commit,
          since: COMMON_FILTER_PROPERTIES.since,
          until: COMMON_FILTER_PROPERTIES.until,
          appmap: COMMON_FILTER_PROPERTIES.appmap,
          limit: COMMON_FILTER_PROPERTIES.limit,
          offset: COMMON_FILTER_PROPERTIES.offset,
        },
      },
    },
    handler: (args, { db }) => find(db, 'queries', buildFindFilter(args)),
  },

  {
    spec: {
      name: 'find_calls',
      description:
        'Function-call rows. Filter by `class` (substring), `method` (substring), `label` (e.g. "log", "security.authorization"), `duration`, `appmap`, or `event_id` (exact ids — e.g. drilled off a get_call_tree `#id` — returned with full, untruncated parameters_json / return_value). Class syntax: short ("Cipher") matches any leaf class; package-qualified ("app/services/Payment") strict-matches; "Class#method" for instance, "Class.method" for static; class+method may be combined. parameters_json and return_value are captured for every call. When the result is empty, response includes `diagnostic.did_you_mean` and a `hint` — read it before guessing another identifier shape.',
      inputSchema: {
        type: 'object',
        properties: {
          class: {
            type: 'string',
            description:
              'Substring of the class identifier; canonical forms ("UserRepository", "app/services/UserRepository", "UserRepository#findById") get exact-or-leaf-class matching, but a partial like "Repo" also matches "UserRepository".',
          },
          method: { type: 'string', description: 'Substring of the method name.' },
          label: { type: 'string', description: 'Substring of the label name.' },
          event_id: {
            type: 'array',
            items: { type: 'integer' },
            description:
              'Exact event_id(s) to fetch — e.g. ids read off a get_call_tree `#id`. Returns those rows with full, untruncated parameters_json and return_value. Pass several ids in one call to drill a set of sibling calls at once.',
          },
          duration: COMMON_FILTER_PROPERTIES.duration,
          route: COMMON_FILTER_PROPERTIES.route,
          status: COMMON_FILTER_PROPERTIES.status,
          branch: COMMON_FILTER_PROPERTIES.branch,
          commit: COMMON_FILTER_PROPERTIES.commit,
          since: COMMON_FILTER_PROPERTIES.since,
          until: COMMON_FILTER_PROPERTIES.until,
          appmap: COMMON_FILTER_PROPERTIES.appmap,
          limit: COMMON_FILTER_PROPERTIES.limit,
          offset: COMMON_FILTER_PROPERTIES.offset,
        },
      },
    },
    handler: (args, { db }) => {
      const filter = buildFindFilter(args);
      const page = find(db, 'calls', filter) as Page<FindCallRow>;
      // Empty results from a class/method query are usually identifier
      // typos, not "the function genuinely didn't fire." Attach a
      // diagnostic so the next call lands instead of triggering yet
      // another shot-in-the-dark retry.
      if (page.rows.length === 0 && (filter.className || filter.method)) {
        const diagnostic = suggestSimilarFunctionIds(db, filter.className, filter.method);
        return { ...page, diagnostic };
      }
      return page;
    },
  },

  {
    spec: {
      name: 'find_logs',
      description:
        'Application log lines captured from functions labeled `log`. Filter by `message` (substring), `class` (logger), recording, branch, or time. `message` is the display-projected log text — use it directly. Use path:lineno to read the call site.',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description:
              'Substring to look for inside the captured log call. Matches a SQL LIKE against parameters_json and return_value — false positives (e.g. matching a class or parameter name) are accepted; tighten in post-processing if needed.',
          },
          logger: {
            type: 'string',
            description:
              'Class of the logging function (defined_class). Accepts short or canonical fqid form, same as find_calls --class.',
          },
          branch: COMMON_FILTER_PROPERTIES.branch,
          commit: COMMON_FILTER_PROPERTIES.commit,
          since: COMMON_FILTER_PROPERTIES.since,
          until: COMMON_FILTER_PROPERTIES.until,
          appmap: COMMON_FILTER_PROPERTIES.appmap,
          limit: COMMON_FILTER_PROPERTIES.limit,
          offset: COMMON_FILTER_PROPERTIES.offset,
        },
      },
    },
    handler: (args, { db }) => find(db, 'logs', buildFindFilter(args)),
  },

  {
    spec: {
      name: 'find_exceptions',
      description:
        'Exception rows with class, message, source location. Filter by exception class (substring), route, status, branch, or time. Pass `with_logs=N` to attach the last N log lines preceding the throw under `recent_logs` — usually the fastest way to see what the app reported before the failure (logs from inside the throwing call are included).',
      inputSchema: {
        type: 'object',
        properties: {
          exception: { type: 'string', description: 'Substring of the exception class name.' },
          with_logs: {
            type: 'integer',
            description: 'Attach up to N preceding log lines per exception under recent_logs (chronological). Each entry has the same shape as a find_logs row.',
          },
          route: COMMON_FILTER_PROPERTIES.route,
          status: COMMON_FILTER_PROPERTIES.status,
          branch: COMMON_FILTER_PROPERTIES.branch,
          commit: COMMON_FILTER_PROPERTIES.commit,
          since: COMMON_FILTER_PROPERTIES.since,
          until: COMMON_FILTER_PROPERTIES.until,
          appmap: COMMON_FILTER_PROPERTIES.appmap,
          limit: COMMON_FILTER_PROPERTIES.limit,
          offset: COMMON_FILTER_PROPERTIES.offset,
        },
      },
    },
    handler: (args, { db }) => find(db, 'exceptions', buildFindFilter(args)),
  },

  // ----- per-recording / cross-recording --------------------------------

  {
    spec: {
      name: 'get_call_tree',
      description:
        'Call tree of one recording. **First call**: `get_call_tree(appmap=<path>)` — returns text-format tree, capped at 12,000 chars by default with inline `[clipped: N events, B bytes; drill via child_depth=K or focus on #event]` markers at cut sites. `appmap` must be the `path` field from `find_recordings` (absolute file path; names/ids rejected). Optional params: `max_chars=N` to widen or narrow the byte budget; `child_depth=N` to cap fetch depth (caps what the budget can render); `focus_type` ∈ {function, sql_query, http_server_request, http_client_request} + `focus_value` to narrow to a function/SQL/route; `min_elapsed_ms` to prune fast leaves; `format="json"` for nodes[] with full structured fields (args/return_value/etc.) — JSON ignores max_chars and uses the legacy depth auto-tune. Response signals: `clipped_events`/`clipped_bytes` + per-marker drill anchors; `summary_mode` + `suggested_drilldown` (JSON only — recording too big at fetched depth); `diagnostic` (focus matched nothing — re-aim).',
      inputSchema: {
        type: 'object',
        properties: {
          appmap: {
            type: 'string',
            description:
              'Canonical recording path — the `path` field returned by find_recordings (the absolute file path on disk).',
          },
          focus_type: {
            type: 'string',
            enum: ['function', 'sql_query', 'http_server_request', 'http_client_request'],
          },
          focus_value: { type: 'string' },
          parent_depth: { type: 'integer', description: 'Ancestor levels (default 5).' },
          child_depth: {
            type: 'integer',
            description:
              'Descendant levels. When omitted, defaults to 4 for narrow per-request recordings and 2 for broad junit/process recordings (event_count > 500).',
          },
          min_elapsed_ms: { type: 'number' },
          format: {
            type: 'string',
            enum: ['text', 'json'],
            description:
              'Tree-body format. `text` (default): indented one-line-per-event, prefixed with `#event_id` for drilldown. `json`: nodes[] array with full structured fields (args, return_value, etc.). Text is ~3-5× more compact; use json when you need structured fields the text form drops.',
          },
          max_chars: {
            type: 'integer',
            description:
              'Byte budget for the rendered tree. Default 12000 in text mode. Breadth-first fill: each depth completes before the next, the final layer partial-fills in event_id order, clipped subtrees get inline `[clipped: N events, B bytes; drill via child_depth=K or focus on #event]` markers at the cut sites. Response surfaces `rendered_events`, `clipped_events`, `clipped_bytes`, `cutoff_depth`, `partial_depth`. When both `max_chars` and `child_depth` are set, both apply as upper bounds — the more restrictive wins on each axis (bytes can only shrink what depth provides; depth can only cap what bytes would have allowed). Ignored for `format=json`.',
          },
        },
        required: ['appmap'],
      },
    },
    handler: (args, { db }) => {
      const am = resolveAppmapPath(db, args.appmap);
      const shape = readRecordingShape(db, am.id);

      const focusType = maybeString(args.focus_type);
      const focusValue = maybeString(args.focus_value);
      const parentDepthIn = maybeNumber(args.parent_depth);
      const childDepthIn = maybeNumber(args.child_depth);
      const format = maybeString(args.format) === 'json' ? 'json' : 'text';
      // Text mode: max_chars governs the response by default. Caller
      // can override by passing max_chars; json mode ignores max_chars
      // (the auto-tune below + RESPONSE_BUDGET_CHARS summary fallback
      // serve as the safety net there).
      const maxCharsIn = maybeNumber(args.max_chars);
      const maxChars =
        format === 'text' ? (maxCharsIn ?? DEFAULT_MAX_CHARS) : maxCharsIn;

      // Pick the DB-fetch depth. Text mode (the default) goes through
      // the byte-budgeted renderer, so we fetch deep and let the
      // renderer trim — depth-based pre-pruning would hide useful
      // material from the budget fill. JSON mode keeps the legacy
      // event-count auto-tune as a safety net since max_chars doesn't
      // apply there.
      const broadDefault = isBroadRecording(shape);
      let chosenChildDepth = childDepthIn;
      let autoReason: string | undefined;
      if (chosenChildDepth === undefined && format === 'text') {
        chosenChildDepth = DEEP_FETCH_DEPTH_FOR_BUDGET;
        autoReason =
          `text mode (max_chars=${maxChars}); fetching deep ` +
          `(child_depth=${DEEP_FETCH_DEPTH_FOR_BUDGET}) and letting the renderer ` +
          `trim by bytes. Pass child_depth explicitly to cap depth.`;
      } else if (chosenChildDepth === undefined && broadDefault) {
        chosenChildDepth = BROAD_DEFAULT_CHILD_DEPTH;
        autoReason =
          `${shape.recorder_type ?? 'process-wide'} recording has ${shape.event_count} events; ` +
          `using child_depth=${BROAD_DEFAULT_CHILD_DEPTH} to fit the response budget. ` +
          `Pass child_depth explicitly to override.`;
      }

      const opts: TreeOptions = {};
      if (focusType && focusValue) {
        if (focusType === 'function') opts.focusFn = focusValue;
        else if (focusType === 'sql_query') opts.focusSql = focusValue;
        else if (focusType === 'http_server_request') opts.focusRoute = focusValue;
        else if (focusType === 'http_client_request') opts.focusUrl = focusValue;
      }
      opts.ancestors = parentDepthIn;
      opts.descendants = chosenChildDepth;
      opts.minElapsedMs = maybeNumber(args.min_elapsed_ms);

      // Pass am.source_path so resolveAppmap inside tree() exact-matches
      // (source_path is UNIQUE) instead of GLOB-matching, which can
      // re-trigger ambiguity on duplicate-basename recordings.
      const meta = treeWithMeta(db, am.source_path, opts);

      const chosenParams = {
        parent_depth: parentDepthIn ?? null,
        child_depth: chosenChildDepth ?? null,
        focus_type: focusType ?? null,
        focus_value: focusValue ?? null,
      };

      // Empty-focus diagnostic: focus excluded everything. Without this
      // signal the agent only sees nodes:[] and can't tell whether the
      // filter was wrong or the recording genuinely lacked the kind.
      if (focusType && focusValue && meta.nodes.length === 0) {
        return projectTreeResponse(
          {
            ...meta,
            chosen_params: chosenParams,
            ...(autoReason ? { reason: autoReason } : {}),
            diagnostic: buildEmptyFocusDiagnostic(focusType, shape),
          },
          format,
          maxChars
        );
      }

      // When the caller supplied max_chars with text format, the
      // budgeted renderer handles clipping inline — skip summary-mode
      // fallback entirely.
      if (maxChars === undefined || format !== 'text') {
        // Budget check: if the rendered response would still be huge, fall
        // back to summary mode (entry-points + exceptions in `nodes`,
        // top-N functions in `suggested_drilldown`). Avoids the LLM seeing
        // a truncated-mid-traversal tree that gives no useful evidence.
        // For budget projection use the format the agent actually asked
        // for — text bodies are 3-5× smaller, so a tree that overflows
        // in json may fit easily in text and shouldn't be summarized.
        const projected =
          format === 'text'
            ? renderTreeForMcp(meta.nodes).length +
              JSON.stringify({ chosen_params: chosenParams }).length
            : JSON.stringify({ ...meta, chosen_params: chosenParams }).length;
        if (projected > RESPONSE_BUDGET_CHARS) {
          const summary = buildSummaryResponse(meta, chosenParams, shape, projected);
          return projectTreeResponse(summary, format, maxChars);
        }
      }

      return projectTreeResponse(
        {
          ...meta,
          chosen_params: chosenParams,
          ...(autoReason ? { reason: autoReason } : {}),
        },
        format,
        maxChars
      );
    },
  },

  {
    spec: {
      name: 'find_related',
      description:
        'Recordings ranked by similarity to a source recording. Score combines: same HTTP route (×5), shared SQL tables (×3 each), shared classes (×2 each). Primary use: pass a failing recording with status:succeeded to find a passing baseline for side-by-side comparison. Returns Page<{appmap_name, score, method, route, status_code, elapsed_ms, shared}> = {rows, total, limit, offset}. shared is a string array of contributing signals.',
      inputSchema: {
        type: 'object',
        properties: {
          appmap: {
            type: 'string',
            description:
              'Canonical source recording path — the `path` field returned by find_recordings (the absolute file path on disk).',
          },
          status: COMMON_FILTER_PROPERTIES.status,
          route: COMMON_FILTER_PROPERTIES.route,
          branch: COMMON_FILTER_PROPERTIES.branch,
          since: COMMON_FILTER_PROPERTIES.since,
          until: COMMON_FILTER_PROPERTIES.until,
          limit: COMMON_FILTER_PROPERTIES.limit,
          offset: COMMON_FILTER_PROPERTIES.offset,
        },
        required: ['appmap'],
      },
    },
    handler: (args, { db }) => {
      const am = resolveAppmapPath(db, args.appmap);
      const filter: RelatedFilter = {};
      if (typeof args.status === 'string') filter.status = parseStatus(args.status);
      filter.route = maybeString(args.route);
      filter.branch = maybeString(args.branch);
      filter.since = maybeTime(args.since);
      filter.until = maybeTime(args.until);
      filter.limit = maybeNumber(args.limit);
      filter.offset = maybeNumber(args.offset);
      return related(db, am.source_path, filter);
    },
  },

  {
    spec: {
      name: 'compare_branches',
      description:
        'Per-route p95 latency for two branches with a delta column. Use to surface regressions a feature branch introduces relative to a baseline. Returns Page<{method, route, a_count, a_p95_ms, b_count, b_p95_ms, delta}> = {rows, total, limit, offset}. delta is b_p95/a_p95; null when either side has no measured durations.',
      inputSchema: {
        type: 'object',
        properties: {
          branch_a: { type: 'string', description: 'Baseline branch.' },
          branch_b: { type: 'string', description: 'Comparison branch.' },
          since: COMMON_FILTER_PROPERTIES.since,
          until: COMMON_FILTER_PROPERTIES.until,
          sort: { type: 'string', enum: ['delta', 'p95-a', 'p95-b'] },
          limit: COMMON_FILTER_PROPERTIES.limit,
          offset: COMMON_FILTER_PROPERTIES.offset,
        },
        required: ['branch_a', 'branch_b'],
      },
    },
    handler: (args, { db }) =>
      compare(db, {
        branch_a: String(args.branch_a),
        branch_b: String(args.branch_b),
        since: maybeTime(args.since),
        until: maybeTime(args.until),
        sort: maybeCompareSort(args.sort),
        limit: maybeNumber(args.limit),
        offset: maybeNumber(args.offset),
      }),
  },
];

// --- resources -----------------------------------------------------------

const RESOURCES: ResourceImpl[] = [
  {
    spec: {
      uri: 'appmap://endpoints',
      name: 'endpoints',
      description:
        'All HTTP endpoints with request count, average latency, p95, and error rate.',
      mimeType: 'application/json',
    },
    read: ({ db }) => endpoints(db, { limit: 200 }),
  },
];

const RESOURCE_TEMPLATES: ResourceTemplateImpl[] = [
  {
    spec: {
      uriTemplate: 'appmap://recording/{ref}/logs',
      name: 'recording_logs',
      description:
        'All log lines (functions labeled `log`) for one recording, ordered by event_id. {ref} is the canonical recording path (find_recordings\' `path` field — the absolute file path on disk; URL-encode it). Each entry has the find_logs row shape.',
      mimeType: 'application/json',
    },
    match: (uri) => {
      const m = /^appmap:\/\/recording\/([^/]+)\/logs$/.exec(uri);
      if (!m) return null;
      // The {ref} segment may be percent-encoded (recording names can
      // contain spaces, em-dashes, etc.).
      return { ref: decodeURIComponent(m[1]) };
    },
    read: (args, { db }) => {
      const info = resolveAppmapPath(db, args.ref);
      return find(db, 'logs', { appmap: info.source_path, limit: 0 });
    },
  },
];

// --- handler -------------------------------------------------------------

export type McpHandler = (msg: JsonRpcRequest) => JsonRpcResponse | null;

export function buildMcpHandler(db: sqlite3.Database): McpHandler {
  const ctx: McpContext = { db };
  return (msg: JsonRpcRequest): JsonRpcResponse | null => {
    const id = msg.id ?? null;
    const method = msg.method;

    if (method.startsWith('notifications/')) return null;

    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          serverInfo: SERVER_INFO,
          capabilities: { tools: {}, resources: {} },
        },
      };
    }

    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS.map((t) => t.spec) },
      };
    }

    if (method === 'tools/call') {
      const params = (msg.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
      const name = params.name;
      const args = params.arguments ?? {};
      const tool = TOOLS.find((t) => t.spec.name === name);
      if (!tool) return errorResponse(id, -32601, `unknown tool: ${name}`);
      try {
        const result = tool.handler(args, ctx);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          },
        };
      } catch (e) {
        const code = e instanceof ParameterValidationError ? -32602 : -32000;
        return errorResponse(id, code, (e as Error).message);
      }
    }

    if (method === 'resources/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: { resources: RESOURCES.map((r) => r.spec) },
      };
    }

    if (method === 'resources/templates/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: { resourceTemplates: RESOURCE_TEMPLATES.map((t) => t.spec) },
      };
    }

    if (method === 'resources/read') {
      const params = (msg.params ?? {}) as { uri?: string };
      const uri = params.uri ?? '';
      const resource = RESOURCES.find((r) => r.spec.uri === uri);
      if (resource) {
        try {
          const result = resource.read(ctx);
          return readResponse(id, uri, resource.spec.mimeType, result);
        } catch (e) {
          return errorResponse(id, -32000, (e as Error).message);
        }
      }
      for (const tmpl of RESOURCE_TEMPLATES) {
        const matched = tmpl.match(uri);
        if (matched) {
          try {
            const result = tmpl.read(matched, ctx);
            return readResponse(id, uri, tmpl.spec.mimeType, result);
          } catch (e) {
            return errorResponse(id, -32000, (e as Error).message);
          }
        }
      }
      return errorResponse(id, -32602, `unknown resource: ${uri}`);
    }

    return errorResponse(id, -32601, `method not found: ${method}`);
  };
}

function errorResponse(
  id: string | number | null,
  code: number,
  message: string
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function readResponse(
  id: string | number | null,
  uri: string,
  mimeType: string,
  result: unknown
): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    result: {
      contents: [
        {
          uri,
          mimeType,
          text: JSON.stringify(result, null, 2),
        },
      ],
    },
  };
}

export function listTools(): readonly ToolSpec[] {
  return TOOLS.map((t) => t.spec);
}

export function listResources(): readonly ResourceSpec[] {
  return RESOURCES.map((r) => r.spec);
}

export function listResourceTemplates(): readonly ResourceTemplateSpec[] {
  return RESOURCE_TEMPLATES.map((t) => t.spec);
}
