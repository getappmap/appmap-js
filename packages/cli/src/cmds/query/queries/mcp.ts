// MCP (Model Context Protocol) handler. Exposes the V3 query surface as
// MCP tools and resources, using the Python prototype's tool names so
// existing clients work unchanged.
//
// Wire format: newline-delimited JSON-RPC 2.0 over stdio. This module
// implements the message dispatch logic only; the stdio loop lives in
// the verb so this file stays testable without process I/O.

import sqlite3 from 'better-sqlite3';

import { compare } from './compare';
import { endpoints } from './endpoints';
import {
  FindCallRow,
  FindExceptionRow,
  FindFilter,
  FindQueryRow,
  FindRequestRow,
  find,
} from './find';
import { hotspots } from './hotspots';
import { related, RelatedFilter } from './related';
import { resolveAppmap, tree, treeSummary, AppmapInfo, TreeOptions } from './tree';
import { parseTime } from '../lib/parseFilter';

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

const SERVER_INFO = { name: 'appmap-query', version: '1.0.0' };
const PROTOCOL_VERSION = '2024-11-05';

// --- helpers ------------------------------------------------------------

// Accept either a numeric appmap.id or a name/basename ref. Resolves to
// the appmaps row; throws if missing or ambiguous (the underlying
// resolveAppmap surfaces both messages).
function resolveByIdOrRef(db: sqlite3.Database, idOrRef: unknown): AppmapInfo {
  const s = String(idOrRef);
  if (/^\d+$/.test(s)) {
    const row = db
      .prepare(`SELECT id, name, source_path FROM appmaps WHERE id = ?`)
      .get(Number(s)) as AppmapInfo | undefined;
    if (row) return row;
    // Fall through to name match if the numeric id doesn't exist —
    // surfaces a clearer error from resolveAppmap.
  }
  return resolveAppmap(db, s);
}

function maybeTime(s: unknown): string | undefined {
  if (typeof s !== 'string' || s.length === 0) return undefined;
  return parseTime(s);
}

function maybeNumber(n: unknown): number | undefined {
  if (typeof n === 'number' && Number.isFinite(n)) return n;
  if (typeof n === 'string' && /^-?\d+(\.\d+)?$/.test(n)) return Number(n);
  return undefined;
}

function maybeString(s: unknown): string | undefined {
  return typeof s === 'string' && s.length > 0 ? s : undefined;
}

// --- tools --------------------------------------------------------------

// Tool name + description + JSON Schema + handler. Names match the
// Python prototype's MCP surface so existing clients work unchanged.
const TOOLS: ToolImpl[] = [
  {
    spec: {
      name: 'get_endpoint_detail',
      description:
        'Individual HTTP request rows for a (method, path), with status, elapsed, branch, and the recording each came from.',
      inputSchema: {
        type: 'object',
        properties: {
          method: { type: 'string', description: 'HTTP method (GET, POST, …).' },
          path: { type: 'string', description: 'Endpoint path (exact normalized_path or path).' },
          since: { type: 'string', description: 'ISO timestamp lower bound.' },
          until: { type: 'string', description: 'ISO timestamp upper bound.' },
          limit: { type: 'integer' },
        },
        required: ['method', 'path'],
      },
    },
    handler: (args, db) => {
      const filter: FindFilter = {
        route: `${String(args.method)} ${String(args.path)}`,
      };
      filter.since = maybeTime(args.since);
      filter.until = maybeTime(args.until);
      filter.limit = maybeNumber(args.limit);
      return find(db, 'requests', filter) as FindRequestRow[];
    },
  },

  {
    spec: {
      name: 'get_slow_queries',
      description:
        'SQL query rows ordered by elapsed time, slowest first. Use to find performance bottlenecks at the database layer.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'integer', description: 'Maximum rows (default 20).' },
          since: { type: 'string' },
          until: { type: 'string' },
        },
      },
    },
    handler: (args, db) => {
      const filter: FindFilter = {};
      filter.since = maybeTime(args.since);
      filter.until = maybeTime(args.until);
      // Sort happens client-side after fetch so we don't pull the entire
      // sql_queries table for large corpora; for now we rely on the
      // implicit caller LIMIT to bound the work.
      const rows = find(db, 'queries', filter) as FindQueryRow[];
      rows.sort((a, b) => (b.elapsed_ms ?? 0) - (a.elapsed_ms ?? 0));
      const limit = maybeNumber(args.limit) ?? 20;
      return rows.slice(0, limit);
    },
  },

  {
    spec: {
      name: 'get_function_hotspots',
      description:
        'Functions ranked by total elapsed time across recordings, with calls / total_ms / self_ms columns.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'integer' },
          since: { type: 'string' },
          until: { type: 'string' },
        },
      },
    },
    handler: (args, db) =>
      hotspots(db, {
        type: 'function',
        since: maybeTime(args.since),
        until: maybeTime(args.until),
        limit: maybeNumber(args.limit) ?? 20,
      }),
  },

  {
    spec: {
      name: 'get_exceptions',
      description:
        'Recent exception rows with class, message, source location, and the appmap they were captured in.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'integer' },
          offset: { type: 'integer' },
          since: { type: 'string' },
          until: { type: 'string' },
        },
      },
    },
    handler: (args, db) => {
      const filter: FindFilter = {};
      filter.since = maybeTime(args.since);
      filter.until = maybeTime(args.until);
      filter.limit = maybeNumber(args.limit) ?? 50;
      filter.offset = maybeNumber(args.offset);
      return find(db, 'exceptions', filter) as FindExceptionRow[];
    },
  },

  {
    spec: {
      name: 'get_log_events',
      description:
        'Function calls labeled "log" — the application log output captured during recording, with parameter values.',
      inputSchema: {
        type: 'object',
        properties: {
          appmap_id: { description: 'Optional — filter to one recording (id or name).' },
          limit: { type: 'integer' },
          since: { type: 'string' },
          until: { type: 'string' },
        },
      },
    },
    handler: (args, db) => {
      const filter: FindFilter = { label: 'log' };
      if (args.appmap_id !== undefined && args.appmap_id !== null) {
        filter.appmap = resolveByIdOrRef(db, args.appmap_id).name;
      }
      filter.since = maybeTime(args.since);
      filter.until = maybeTime(args.until);
      filter.limit = maybeNumber(args.limit) ?? 200;
      return find(db, 'calls', filter) as FindCallRow[];
    },
  },

  {
    spec: {
      name: 'get_labeled_events',
      description:
        'Function calls carrying an AppMap label. Common labels: log, security.authentication, security.authorization, dao, secret. Pass an exact label name.',
      inputSchema: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          appmap_id: {},
          limit: { type: 'integer' },
        },
        required: ['label'],
      },
    },
    handler: (args, db) => {
      const filter: FindFilter = { label: String(args.label) };
      if (args.appmap_id !== undefined && args.appmap_id !== null) {
        filter.appmap = resolveByIdOrRef(db, args.appmap_id).name;
      }
      filter.limit = maybeNumber(args.limit) ?? 200;
      return find(db, 'calls', filter) as FindCallRow[];
    },
  },

  {
    spec: {
      name: 'compare_branches',
      description:
        'Per-route p95 latency for two branches with a delta column. Use to surface performance regressions introduced on a feature branch.',
      inputSchema: {
        type: 'object',
        properties: {
          branch_a: { type: 'string', description: 'Baseline branch.' },
          branch_b: { type: 'string', description: 'Comparison branch.' },
          since: { type: 'string' },
          until: { type: 'string' },
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
        limit: maybeNumber(args.limit),
      }),
  },

  {
    spec: {
      name: 'get_request_trace',
      description:
        'Call tree for one recording. Without focus, returns every event. With focus_type + focus_value, narrows to the neighborhood of matching events. focus_type is one of: function (focus_value = code_object fqid), sql_query (focus_value = SQL substring), http_server_request (focus_value = normalized_path), http_client_request (focus_value = URL substring).',
      inputSchema: {
        type: 'object',
        properties: {
          appmap_id: { description: 'Recording id or name.' },
          focus_type: {
            type: 'string',
            enum: ['function', 'sql_query', 'http_server_request', 'http_client_request'],
          },
          focus_value: { type: 'string' },
          parent_depth: { type: 'integer', description: 'Ancestor levels to keep (default 5).' },
          child_depth: { type: 'integer', description: 'Descendant levels to keep (default 3).' },
          min_elapsed_ms: { type: 'number' },
        },
        required: ['appmap_id'],
      },
    },
    handler: (args, db) => {
      const am = resolveByIdOrRef(db, args.appmap_id);
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
      name: 'get_related',
      description:
        'Recordings ranked by similarity to a source recording. Score combines: same HTTP route (×5), shared SQL tables (×3 each), shared classes (×2 each). Primary use: find passing baselines for a failing recording with --status filter.',
      inputSchema: {
        type: 'object',
        properties: {
          appmap_id: { description: 'Source recording (id or name).' },
          status: { type: 'string', description: 'e.g. "200", ">=500".' },
          route: { type: 'string' },
          branch: { type: 'string' },
          since: { type: 'string' },
          until: { type: 'string' },
          limit: { type: 'integer' },
        },
        required: ['appmap_id'],
      },
    },
    handler: (args, db) => {
      const am = resolveByIdOrRef(db, args.appmap_id);
      const filter: RelatedFilter = {};
      if (args.status !== undefined && args.status !== null) {
        // parseStatus is in lib/parseFilter; import lazily to avoid a cycle
        // (mcp.ts → queries/related → lib/scope → lib/parseFilter is fine).
        const { parseStatus } = require('../lib/parseFilter');
        filter.status = parseStatus(String(args.status));
      }
      filter.route = maybeString(args.route);
      filter.branch = maybeString(args.branch);
      filter.since = maybeTime(args.since);
      filter.until = maybeTime(args.until);
      filter.limit = maybeNumber(args.limit);
      return related(db, am.name, filter);
    },
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

// --- handler -------------------------------------------------------------

export interface McpHandler {
  (msg: JsonRpcRequest): JsonRpcResponse | null;
}

// Build a JSON-RPC dispatcher backed by the given DB. Returns null for
// notifications (no response expected).
export function buildMcpHandler(db: sqlite3.Database): McpHandler {
  return (msg: JsonRpcRequest): JsonRpcResponse | null => {
    const id = (msg.id ?? null) as string | number | null;
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
        return errorResponse(id, -32000, (e as Error).message);
      }
    }

    if (method === 'resources/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: { resources: RESOURCES.map((r) => r.spec) },
      };
    }

    if (method === 'resources/read') {
      const params = (msg.params ?? {}) as { uri?: string };
      const resource = RESOURCES.find((r) => r.spec.uri === params.uri);
      if (!resource) return errorResponse(id, -32602, `unknown resource: ${params.uri}`);
      try {
        const result = resource.read(db);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri: resource.spec.uri,
                mimeType: resource.spec.mimeType,
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        };
      } catch (e) {
        return errorResponse(id, -32000, (e as Error).message);
      }
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

// Exposed for the demo / docs; keeps the tool list discoverable without
// going through the protocol.
export function listTools(): readonly ToolSpec[] {
  return TOOLS.map((t) => t.spec);
}

export function listResources(): readonly ResourceSpec[] {
  return RESOURCES.map((r) => r.spec);
}
