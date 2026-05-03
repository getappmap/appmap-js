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
import { resolveAppmap, tree, AppmapInfo, TreeOptions } from './tree';
import { parseDuration, parseStatus, parseTime } from '../lib/parseFilter';

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

interface ToolImpl {
  spec: ToolSpec;
  handler: (args: Record<string, unknown>, db: sqlite3.Database) => unknown;
}

interface ResourceSpec {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

interface ResourceImpl {
  spec: ResourceSpec;
  read: (db: sqlite3.Database) => unknown;
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
  read: (args: Record<string, string>, db: sqlite3.Database) => unknown;
}

const SERVER_INFO = { name: 'appmap-query', version: '1.0.0' };
const PROTOCOL_VERSION = '2024-11-05';

// --- helpers ------------------------------------------------------------

// Accept either a numeric appmap.id or a name/basename ref.
function resolveByIdOrRef(db: sqlite3.Database, idOrRef: unknown): AppmapInfo {
  const s = String(idOrRef);
  if (/^\d+$/.test(s)) {
    const row = db
      .prepare(`SELECT id, name, source_path FROM appmaps WHERE id = ?`)
      .get(Number(s)) as AppmapInfo | undefined;
    if (row) return row;
  }
  return resolveAppmap(db, s);
}

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

// Common filter shape shared by the find_* tools and the hotspots tools.
const COMMON_FILTER_PROPERTIES: Record<string, unknown> = {
  route: { type: 'string', description: 'e.g. "POST /orders" or "/orders".' },
  status: { type: 'string', description: 'e.g. "500", ">=500", "<400".' },
  duration: { type: 'string', description: 'e.g. ">1s", ">=500ms".' },
  branch: { type: 'string' },
  commit: { type: 'string' },
  since: { type: 'string', description: 'ISO timestamp lower bound.' },
  until: { type: 'string', description: 'ISO timestamp upper bound.' },
  appmap: { type: 'string', description: 'Restrict to one recording (name or basename).' },
  limit: { type: 'integer' },
  offset: { type: 'integer' },
};

// Build a FindFilter from MCP tool args, parsing structured fields.
function buildFindFilter(args: Record<string, unknown>): FindFilter {
  const f: FindFilter = {};
  if (typeof args.route === 'string') f.route = args.route;
  if (typeof args.class === 'string') f.className = args.class;
  if (typeof args.method === 'string') f.method = args.method;
  if (typeof args.label === 'string') f.label = args.label;
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
        'Per-route summary table; the first call when orienting against an unfamiliar query database. Returns: method, route, count, avg_ms, p95_ms, err_pct.',
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
    handler: (args, db) => {
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
        'Functions ranked by total elapsed time across recordings. Filter by route to scope to a specific entry point or by class to focus on one component. Returns: fqid, defined_class, method_id, path, lineno, calls, total_ms, self_ms. path/lineno are one representative call\'s source location — read directly to see the function. fqid examples: "app/Logger#error" (instance), "app/Util.parse" (static), "src/cmds/query/db/openQueryDb.openQueryDb" (module-level), "app/Outer::Inner#method" (nested classes).',
      inputSchema: {
        type: 'object',
        properties: {
          route: { type: 'string' },
          class: { type: 'string', description: 'class identifier; accepts short or canonical fqid form.' },
          branch: { type: 'string' },
          since: { type: 'string' },
          until: { type: 'string' },
          limit: { type: 'integer' },
        },
      },
    },
    handler: (args, db) =>
      hotspots(db, {
        type: 'function',
        route: maybeString(args.route),
        className: maybeString(args.class),
        branch: maybeString(args.branch),
        since: maybeTime(args.since),
        until: maybeTime(args.until),
        limit: maybeNumber(args.limit) ?? 20,
      }),
  },

  {
    spec: {
      name: 'sql_hotspots',
      description:
        'SQL queries ranked by total elapsed time, deduplicated by text. Returns: count, avg_ms, total_ms, sql_text.',
      inputSchema: {
        type: 'object',
        properties: {
          route: { type: 'string' },
          branch: { type: 'string' },
          since: { type: 'string' },
          until: { type: 'string' },
          limit: { type: 'integer' },
        },
      },
    },
    handler: (args, db) =>
      hotspots(db, {
        type: 'sql',
        route: maybeString(args.route),
        branch: maybeString(args.branch),
        since: maybeTime(args.since),
        until: maybeTime(args.until),
        limit: maybeNumber(args.limit) ?? 20,
      }),
  },

  {
    spec: {
      name: 'list_labels',
      description:
        'AppMap labels present in the database, ranked by usage. Use to discover what semantic anchors exist (canonical: "log", "secret", "security.authentication", "security.authorization", "deserialize", "system.exec", "job.create", "http.session.clear") and any project-specific or investigation labels (e.g. "bug.<id>", "repro"). Pass a returned label to find_calls --label to retrieve its calls. Returns: label, count (distinct code objects bearing it), sample_fqid (one representative function).',
      inputSchema: { type: 'object', properties: {} },
    },
    handler: (_args, db) =>
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
        'Recording-level rows matching filters. Each row is one .appmap.json file with its sample request, branch, and counts. Use to identify which recordings exercised a route, returned a particular status, or were taken on a branch. Returns: appmap_id, appmap_name, route, status_code, elapsed_ms, sql_count, branch, timestamp. Pass appmap_id (numeric) or appmap_name to get_call_tree / find_related.',
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
    handler: (args, db) => find(db, 'appmaps', buildFindFilter(args)),
  },

  {
    spec: {
      name: 'find_requests',
      description:
        'Individual HTTP request rows with status, elapsed time, and the recording each came from. Filter by route, status, duration, branch, time window. Returns: appmap_name, event_id, method, route, status_code, elapsed_ms, branch.',
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
    handler: (args, db) =>
      find(db, 'requests', buildFindFilter(args)) as FindRequestRow[],
  },

  {
    spec: {
      name: 'find_queries',
      description:
        'SQL query rows. Filter by table (matches sql_text substring), caller class/method, duration, route, branch. Use duration:">100ms" to find slow queries; use route to scope to a specific request. Returns: appmap_name, event_id, sql_text, elapsed_ms, caller_class, caller_method.',
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
    handler: (args, db) => find(db, 'queries', buildFindFilter(args)) as FindQueryRow[],
  },

  {
    spec: {
      name: 'find_calls',
      description:
        'Function-call rows. Filter by class, method, label (e.g. "log", "security.authorization"), duration. Use --label=log to retrieve application log output, or --label=security.authorization to find authorization checks. Returns: appmap_name, event_id, fqid, defined_class, method_id, path, lineno, elapsed_ms, parameters_json, return_value. parameters_json and return_value are populated only for labeled functions; unlabeled rows return null. Use path:lineno to read the source.',
      inputSchema: {
        type: 'object',
        properties: {
          class: {
            type: 'string',
            description: 'Class identifier; accepts short ("UserRepository") or canonical fqid form ("app/services/UserRepository") or with method ("UserRepository#findById").',
          },
          method: { type: 'string' },
          label: { type: 'string', description: 'AppMap label name (exact match).' },
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
    handler: (args, db) => find(db, 'calls', buildFindFilter(args)) as FindCallRow[],
  },

  {
    spec: {
      name: 'find_logs',
      description:
        'Application log lines captured from functions labeled `log`. Filter by message substring (matches across the call\'s parameters and return value), logger class, recording, branch, or time window. Returns: appmap_name, event_id, parent_event_id, logger, method_id, path, lineno, parameters_json, return_value. The message is in parameters_json (a [{name, class, value}, ...] blob) — read the value of the parameter named `message`/`msg`, or the first string-typed parameter, or parse return_value as JSON if the recorder returns a structured `{level, message, ...}`. Use path:lineno to read the call site of the log statement.',
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
    handler: (args, db) => find(db, 'logs', buildFindFilter(args)) as FindLogRow[],
  },

  {
    spec: {
      name: 'find_exceptions',
      description:
        'Exception rows with class, message, source location. Filter by exception class name, the request that owns the exception (via route/status), branch, or time window. Returns: appmap_id, appmap_name, event_id, exception_class, message, path, lineno. Pass with_logs=N to attach the last N log lines preceding each exception (chronological order) under recent_logs — usually the fastest way to see what the app reported before the failure.',
      inputSchema: {
        type: 'object',
        properties: {
          exception: { type: 'string', description: 'Exception class name (exact match).' },
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
    handler: (args, db) =>
      find(db, 'exceptions', buildFindFilter(args)) as FindExceptionRow[],
  },

  // ----- per-recording / cross-recording --------------------------------

  {
    spec: {
      name: 'get_call_tree',
      description:
        'Call tree of one recording. Without focus, returns every event. With focus_type + focus_value, narrows to the neighborhood of matching events: focus_type ∈ {function, sql_query, http_server_request, http_client_request}, focus_value is the matching identifier (fqid / SQL substring / normalized_path / URL substring). Use min_elapsed_ms to prune fast leaves. The appmap argument accepts a numeric appmap_id or an appmap_name (both surfaced by find_recordings). Returns ordered nodes: each has depth, kind ∈ {function, sql, http_server, http_client, exception}, event_id, parent_event_id, elapsed_ms, plus kind-specific fields (function: fqid/defined_class/method_id/path/lineno/parameters_json/return_value; sql: sql_text; http_server: method/route/status_code; http_client: method/url/status_code; exception: exception_class/message/path/lineno). function nodes\' parameters_json and return_value are populated only for labeled functions. Use path:lineno on function and exception nodes to read the source. fqid examples: "app/Logger#error" (instance), "app/Util.parse" (static).',
      inputSchema: {
        type: 'object',
        properties: {
          appmap: { type: 'string', description: 'Recording id (numeric) or name.' },
          focus_type: {
            type: 'string',
            enum: ['function', 'sql_query', 'http_server_request', 'http_client_request'],
          },
          focus_value: { type: 'string' },
          parent_depth: { type: 'integer', description: 'Ancestor levels (default 5).' },
          child_depth: { type: 'integer', description: 'Descendant levels (default 3).' },
          min_elapsed_ms: { type: 'number' },
        },
        required: ['appmap'],
      },
    },
    handler: (args, db) => {
      const am = resolveByIdOrRef(db, args.appmap);
      const opts: TreeOptions = {};
      const focusType = maybeString(args.focus_type);
      const focusValue = maybeString(args.focus_value);
      if (focusType && focusValue) {
        if (focusType === 'function') opts.focusFn = focusValue;
        else if (focusType === 'sql_query') opts.focusSql = focusValue;
        else if (focusType === 'http_server_request') opts.focusRoute = focusValue;
        else if (focusType === 'http_client_request') opts.focusUrl = focusValue;
      }
      opts.ancestors = maybeNumber(args.parent_depth);
      opts.descendants = maybeNumber(args.child_depth);
      opts.minElapsedMs = maybeNumber(args.min_elapsed_ms);
      return tree(db, am.name, opts);
    },
  },

  {
    spec: {
      name: 'find_related',
      description:
        'Recordings ranked by similarity to a source recording. Score combines: same HTTP route (×5), shared SQL tables (×3 each), shared classes (×2 each). Primary use: pass a failing recording with status:succeeded to find a passing baseline for side-by-side comparison. Returns: appmap_name, score, method, route, status_code, elapsed_ms, shared (string array of contributing signals).',
      inputSchema: {
        type: 'object',
        properties: {
          appmap: { type: 'string', description: 'Source recording (id or name).' },
          status: COMMON_FILTER_PROPERTIES.status,
          route: COMMON_FILTER_PROPERTIES.route,
          branch: COMMON_FILTER_PROPERTIES.branch,
          since: COMMON_FILTER_PROPERTIES.since,
          until: COMMON_FILTER_PROPERTIES.until,
          limit: COMMON_FILTER_PROPERTIES.limit,
        },
        required: ['appmap'],
      },
    },
    handler: (args, db) => {
      const am = resolveByIdOrRef(db, args.appmap);
      const filter: RelatedFilter = {};
      if (typeof args.status === 'string') filter.status = parseStatus(args.status);
      filter.route = maybeString(args.route);
      filter.branch = maybeString(args.branch);
      filter.since = maybeTime(args.since);
      filter.until = maybeTime(args.until);
      filter.limit = maybeNumber(args.limit);
      return related(db, am.name, filter);
    },
  },

  {
    spec: {
      name: 'compare_branches',
      description:
        'Per-route p95 latency for two branches with a delta column. Use to surface regressions a feature branch introduces relative to a baseline. Returns: method, route, a_count, a_p95_ms, b_count, b_p95_ms, delta (b_p95/a_p95; null when either side has no measured durations).',
      inputSchema: {
        type: 'object',
        properties: {
          branch_a: { type: 'string', description: 'Baseline branch.' },
          branch_b: { type: 'string', description: 'Comparison branch.' },
          since: { type: 'string' },
          until: { type: 'string' },
          sort: { type: 'string', enum: ['delta', 'p95-a', 'p95-b'] },
          limit: { type: 'integer' },
        },
        required: ['branch_a', 'branch_b'],
      },
    },
    handler: (args, db) =>
      compare(db, {
        branch_a: String(args.branch_a),
        branch_b: String(args.branch_b),
        since: maybeTime(args.since),
        until: maybeTime(args.until),
        sort: maybeCompareSort(args.sort),
        limit: maybeNumber(args.limit),
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
    read: (db) => endpoints(db, { limit: 200 }),
  },
];

const RESOURCE_TEMPLATES: ResourceTemplateImpl[] = [
  {
    spec: {
      uriTemplate: 'appmap://recording/{ref}/logs',
      name: 'recording_logs',
      description:
        'All log lines (functions labeled `log`) for one recording, ordered by event_id. {ref} is either the numeric appmap_id or the recording name/basename — same forms find_recordings returns. Each entry has the find_logs row shape.',
      mimeType: 'application/json',
    },
    match: (uri) => {
      const m = /^appmap:\/\/recording\/([^/]+)\/logs$/.exec(uri);
      if (!m) return null;
      // The {ref} segment may be percent-encoded (recording names can
      // contain spaces, em-dashes, etc.).
      return { ref: decodeURIComponent(m[1]) };
    },
    read: (args, db) => {
      const info = resolveByIdOrRef(db, args.ref);
      return find(db, 'logs', { appmap: info.name }) as FindLogRow[];
    },
  },
];

// --- handler -------------------------------------------------------------

export type McpHandler = (msg: JsonRpcRequest) => JsonRpcResponse | null;

export function buildMcpHandler(db: sqlite3.Database): McpHandler {
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
        const result = tool.handler(args, db);
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
          const result = resource.read(db);
          return readResponse(id, uri, resource.spec.mimeType, result);
        } catch (e) {
          return errorResponse(id, -32000, (e as Error).message);
        }
      }
      for (const tmpl of RESOURCE_TEMPLATES) {
        const matched = tmpl.match(uri);
        if (matched) {
          try {
            const result = tmpl.read(matched, db);
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
