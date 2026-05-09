// HTTP server for `appmap query ui`.
//
// Express adapter that exposes the typed query functions (find_*,
// endpoints, hotspots, tree, related, compare, dashboard) as a small
// JSON REST surface on top of a read-only query.db. The `/api/*` routes
// are thin pass-throughs over the existing query layer; the server also
// serves the React SPA bundle from `staticDir` and falls through to
// index.html for SPA routes.

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { existsSync, statSync } from 'fs';
import { Server } from 'http';
import path from 'path';

import sqlite3 from 'better-sqlite3';

import { compare } from '../queries/compare';
import { dashboardTotals } from '../queries/dashboard';
import { endpoints, EndpointSort, EndpointsFilter } from '../queries/endpoints';
import { find, FindAppmapRow, FindFilter } from '../queries/find';
import { hotspots, HotspotsFilter } from '../queries/hotspots';
import { related, RelatedFilter } from '../queries/related';
import { treeWithMeta, TreeOptions } from '../queries/tree';
import { Page } from './page';
import { parseDuration, parseStatus, parseTime } from './parseFilter';
import { decorateRecording, resolveAppmapPath } from './recordingId';

export interface UIServerOptions {
  db: sqlite3.Database;
  // 0 (or undefined) means "let the OS pick a free port".
  port?: number;
  // Absolute path to the built SPA. If the directory or its index.html
  // doesn't exist, the server still runs (the API works) and the root
  // path returns a build-instruction message instead of 500-ing.
  staticDir: string;
}

export interface UIServerHandle {
  server: Server;
  port: number;
  url: string;
  close: () => Promise<void>;
}

function maybeString(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function maybeNumber(v: unknown): number | undefined {
  if (typeof v === 'string' && /^-?\d+$/.test(v)) return Number.parseInt(v, 10);
  return undefined;
}

function maybeTime(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? parseTime(v) : undefined;
}

// Build a FindFilter from query-string params. Mirrors the parser in
// queries/mcp.ts buildFindFilter, adapted for HTTP query strings (where
// every value is a string before parse).
function buildFindFilter(req: Request): FindFilter {
  const q = req.query;
  const f: FindFilter = {};
  f.route = maybeString(q.route);
  f.className = maybeString(q.class);
  f.method = maybeString(q.method);
  f.label = maybeString(q.label);
  f.branch = maybeString(q.branch);
  f.commit = maybeString(q.commit);
  f.appmap = maybeString(q.appmap);
  f.table = maybeString(q.table);
  f.exception = maybeString(q.exception);
  f.logger = maybeString(q.logger);
  f.message = maybeString(q.message);
  const status = maybeString(q.status);
  if (status) f.status = parseStatus(status);
  const duration = maybeString(q.duration);
  if (duration) f.duration = parseDuration(duration);
  f.since = maybeTime(q.since);
  f.until = maybeTime(q.until);
  f.limit = maybeNumber(q.limit);
  f.offset = maybeNumber(q.offset);
  const withLogs = maybeNumber(q.with_logs);
  if (withLogs !== undefined) f.withLogs = withLogs;
  return f;
}

// Wrap a sync handler so any thrown Error becomes a 400 JSON response.
// Filter parsers (parseStatus, parseTime) throw on bad input — surface
// the message so the client sees what's wrong without a 500.
function wrap(handler: (req: Request, res: Response) => void) {
  return (req: Request, res: Response, _next: NextFunction): void => {
    try {
      handler(req, res);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  };
}

export function buildUIApp(opts: UIServerOptions): express.Express {
  const { db, staticDir } = opts;
  const app = express();
  app.use(cors());

  // ---- aggregations -----------------------------------------------------

  app.get(
    '/api/dashboard',
    wrap((_req, res) => {
      res.json(dashboardTotals(db));
    })
  );

  app.get(
    '/api/endpoints',
    wrap((req, res) => {
      const f: EndpointsFilter = {};
      f.branch = maybeString(req.query.branch);
      f.since = maybeTime(req.query.since);
      f.until = maybeTime(req.query.until);
      const status = maybeString(req.query.status);
      if (status) f.status = parseStatus(status);
      const sort = maybeString(req.query.sort);
      if (sort) f.sort = sort as EndpointSort;
      f.limit = maybeNumber(req.query.limit);
      f.offset = maybeNumber(req.query.offset);
      res.json(endpoints(db, f));
    })
  );

  // /api/functions/hotspots and /api/sql/hotspots both back onto
  // hotspots() with a different `type`. Splitting paths so the UI's
  // routing maps cleanly to the page surface.
  app.get(
    '/api/functions/hotspots',
    wrap((req, res) => {
      const f: HotspotsFilter = { type: 'function' };
      f.className = maybeString(req.query.class);
      f.appmap = maybeString(req.query.appmap);
      f.limit = maybeNumber(req.query.limit);
      f.offset = maybeNumber(req.query.offset);
      res.json(hotspots(db, f));
    })
  );

  app.get(
    '/api/sql/hotspots',
    wrap((req, res) => {
      const f: HotspotsFilter = { type: 'sql' };
      f.appmap = maybeString(req.query.appmap);
      f.limit = maybeNumber(req.query.limit);
      f.offset = maybeNumber(req.query.offset);
      res.json(hotspots(db, f));
    })
  );

  app.get(
    '/api/labels',
    wrap((_req, res) => {
      const rows = db
        .prepare(
          `SELECT l.label                  AS label,
                  COUNT(DISTINCT co.id)    AS count,
                  MIN(co.fqid)             AS sample_fqid
           FROM labels l
           JOIN code_objects co ON co.id = l.code_object_id
           GROUP BY l.label
           ORDER BY count DESC, l.label`
        )
        .all();
      res.json(rows);
    })
  );

  // ---- row-level finders ------------------------------------------------

  app.get(
    '/api/recordings',
    wrap((req, res) => {
      const filter = buildFindFilter(req);
      const page = find(db, 'appmaps', filter) as Page<FindAppmapRow>;
      res.json({ ...page, rows: page.rows.map((r) => decorateRecording(r)) });
    })
  );

  app.get(
    '/api/requests',
    wrap((req, res) => {
      res.json(find(db, 'requests', buildFindFilter(req)));
    })
  );

  app.get(
    '/api/queries',
    wrap((req, res) => {
      res.json(find(db, 'queries', buildFindFilter(req)));
    })
  );

  app.get(
    '/api/calls',
    wrap((req, res) => {
      res.json(find(db, 'calls', buildFindFilter(req)));
    })
  );

  app.get(
    '/api/logs',
    wrap((req, res) => {
      res.json(find(db, 'logs', buildFindFilter(req)));
    })
  );

  app.get(
    '/api/exceptions',
    wrap((req, res) => {
      const filter = buildFindFilter(req);
      // Default to attaching 5 preceding logs per exception so the UI
      // can show a "what did the app log before the throw?" panel
      // without a follow-up call. Caller can override with
      // ?with_logs=N (or 0 to disable).
      if (filter.withLogs === undefined) filter.withLogs = 5;
      res.json(find(db, 'exceptions', filter));
    })
  );

  // ---- per-recording / cross-recording ---------------------------------

  app.get(
    '/api/recording',
    wrap((req, res) => {
      const ref = maybeString(req.query.appmap);
      if (!ref) {
        res.status(400).json({ error: 'appmap query parameter is required' });
        return;
      }
      const am = resolveAppmapPath(db, ref);
      // Single-recording metadata + per-table counts. The UI's detail
      // page renders this header above the embedded viewer iframe.
      const row = db
        .prepare(
          `SELECT id, name, source_path, language, framework, recorder_type,
                  git_repository, git_branch, git_commit, timestamp,
                  event_count, sql_query_count, http_request_count, elapsed_ms
             FROM appmaps WHERE id = ?`
        )
        .get(am.id) as Record<string, unknown>;
      const counts = db
        .prepare(
          `SELECT
             (SELECT COUNT(*) FROM http_requests        WHERE appmap_id = ?) AS http_requests,
             (SELECT COUNT(*) FROM http_client_requests WHERE appmap_id = ?) AS http_client_requests,
             (SELECT COUNT(*) FROM sql_queries          WHERE appmap_id = ? AND sql_text NOT IN ('BEGIN','COMMIT')) AS sql_queries,
             (SELECT COUNT(*) FROM function_calls       WHERE appmap_id = ?) AS function_calls,
             (SELECT COUNT(*) FROM exceptions           WHERE appmap_id = ?) AS exceptions`
        )
        .get(am.id, am.id, am.id, am.id, am.id) as Record<string, number>;
      res.json({ recording: { ...row, path: am.source_path, label: am.name }, counts });
    })
  );

  app.get(
    '/api/tree',
    wrap((req, res) => {
      const ref = maybeString(req.query.appmap);
      if (!ref) {
        res.status(400).json({ error: 'appmap query parameter is required' });
        return;
      }
      const am = resolveAppmapPath(db, ref);
      const opts: TreeOptions = {};
      const focusType = maybeString(req.query.focus_type);
      const focusValue = maybeString(req.query.focus_value);
      if (focusType && focusValue) {
        if (focusType === 'function') opts.focusFn = focusValue;
        else if (focusType === 'sql_query') opts.focusSql = focusValue;
        else if (focusType === 'http_server_request') opts.focusRoute = focusValue;
        else if (focusType === 'http_client_request') opts.focusUrl = focusValue;
      }
      opts.ancestors = maybeNumber(req.query.parent_depth);
      opts.descendants = maybeNumber(req.query.child_depth);
      const minMs = maybeNumber(req.query.min_elapsed_ms);
      if (minMs !== undefined) opts.minElapsedMs = minMs;
      res.json(treeWithMeta(db, am.source_path, opts));
    })
  );

  app.get(
    '/api/related',
    wrap((req, res) => {
      const ref = maybeString(req.query.appmap);
      if (!ref) {
        res.status(400).json({ error: 'appmap query parameter is required' });
        return;
      }
      const am = resolveAppmapPath(db, ref);
      const filter: RelatedFilter = {};
      const status = maybeString(req.query.status);
      if (status) filter.status = parseStatus(status);
      filter.route = maybeString(req.query.route);
      filter.branch = maybeString(req.query.branch);
      filter.since = maybeTime(req.query.since);
      filter.until = maybeTime(req.query.until);
      filter.limit = maybeNumber(req.query.limit);
      filter.offset = maybeNumber(req.query.offset);
      res.json(related(db, am.source_path, filter));
    })
  );

  app.get(
    '/api/compare',
    wrap((req, res) => {
      const a = maybeString(req.query.branch_a);
      const b = maybeString(req.query.branch_b);
      if (!a || !b) {
        res.status(400).json({ error: 'branch_a and branch_b query parameters are required' });
        return;
      }
      const sort = maybeString(req.query.sort);
      res.json(
        compare(db, {
          branch_a: a,
          branch_b: b,
          since: maybeTime(req.query.since),
          until: maybeTime(req.query.until),
          sort: sort as 'delta' | 'p95-a' | 'p95-b' | undefined,
          limit: maybeNumber(req.query.limit),
          offset: maybeNumber(req.query.offset),
        })
      );
    })
  );

  // ---- structured search (multi-entity fanout) -------------------------
  //
  // Lightweight parser for the apm-style query syntax. We feed each
  // recognized filter into the relevant typed find_* function and return
  // a single composite result.

  app.get(
    '/api/search',
    wrap((req, res) => {
      const q = maybeString(req.query.q) ?? '';
      const limit = maybeNumber(req.query.limit) ?? 25;
      const filters = parseSearchQuery(q);

      const result: Record<string, unknown> = { query: q, filters };

      const baseFilter = (): FindFilter => {
        const f: FindFilter = { limit };
        if (filters.branch) f.branch = filters.branch;
        if (filters.commit) f.commit = filters.commit;
        if (filters.since) f.since = filters.since;
        if (filters.until) f.until = filters.until;
        if (filters.appmap) f.appmap = filters.appmap;
        if (filters.duration) f.duration = parseDuration(filters.duration);
        if (filters.status) f.status = parseStatus(filters.status);
        return f;
      };

      // HTTP requests
      const reqFilter = baseFilter();
      if (filters.path) reqFilter.route = filters.path;
      if (filters.method && filters.path) reqFilter.route = `${filters.method} ${filters.path}`;
      if (filters.text && !reqFilter.route) reqFilter.route = filters.text;
      if (reqFilter.route || filters.status || filters.duration) {
        result.requests = find(db, 'requests', reqFilter);
      }

      // SQL queries
      const sqlFilter = baseFilter();
      if (filters.table) sqlFilter.table = filters.table;
      if (filters.sql) sqlFilter.table = filters.sql; // table acts as substring
      if (filters.text && !sqlFilter.table) sqlFilter.table = filters.text;
      if (sqlFilter.table || filters.duration) {
        result.queries = find(db, 'queries', sqlFilter);
      }

      // Function calls
      const callFilter = baseFilter();
      if (filters.class) callFilter.className = filters.class;
      if (filters.function) callFilter.method = filters.function;
      if (filters.label) callFilter.label = filters.label;
      if (filters.text && !callFilter.className && !callFilter.method && !callFilter.label) {
        callFilter.className = filters.text;
      }
      if (callFilter.className || callFilter.method || callFilter.label) {
        result.calls = find(db, 'calls', callFilter);
      }

      // Exceptions
      const excFilter = baseFilter();
      if (filters.exception) excFilter.exception = filters.exception;
      if (filters.text && !excFilter.exception) excFilter.exception = filters.text;
      if (excFilter.exception) {
        result.exceptions = find(db, 'exceptions', excFilter);
      }

      // Recordings (always include if no other entity filter narrowed)
      if (
        !result.requests &&
        !result.queries &&
        !result.calls &&
        !result.exceptions
      ) {
        const recFilter = baseFilter();
        if (filters.text) recFilter.appmap = filters.text;
        const page = find(db, 'appmaps', recFilter) as Page<FindAppmapRow>;
        result.recordings = { ...page, rows: page.rows.map((r) => decorateRecording(r)) };
      }

      res.json(result);
    })
  );

  // ---- file serve for the embedded viewer ------------------------------
  //
  // Streams the .appmap.json file *only* if its path is registered in
  // appmaps.source_path, so the UI server can't be coerced into reading
  // arbitrary disk paths.
  app.get(
    '/file',
    wrap((req, res) => {
      const ref = maybeString(req.query.appmap);
      if (!ref) {
        res.status(400).json({ error: 'appmap query parameter is required' });
        return;
      }
      let am;
      try {
        am = resolveAppmapPath(db, ref);
      } catch (err) {
        res.status(404).json({ error: (err as Error).message });
        return;
      }
      if (!existsSync(am.source_path)) {
        res.status(404).json({ error: `appmap file missing on disk: ${am.source_path}` });
        return;
      }
      // Refuse anything bigger than 50MB to avoid handing the browser
      // a recording that won't render anyway. Indexed appmap.json files
      // typically run from KB to a few MB.
      const stat = statSync(am.source_path);
      if (stat.size > 50 * 1024 * 1024) {
        res.status(413).json({ error: `appmap file too large: ${stat.size} bytes` });
        return;
      }
      res.type('application/json').sendFile(am.source_path);
    })
  );

  // ---- static SPA -------------------------------------------------------
  //
  // Everything that isn't /api/* and isn't an asset under staticDir
  // falls through to index.html so React Router can handle client-side
  // routes. If the bundle isn't built, the API still works and the root
  // path returns a friendly build-instruction message.
  const indexHtml = path.join(staticDir, 'index.html');
  const bundleExists = existsSync(indexHtml);

  if (bundleExists) {
    app.use(express.static(staticDir));
  }

  // Catch-all for non-API GETs. Express 5's path-to-regexp doesn't
  // accept '*' as a route — use a middleware after the API routes
  // instead.
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path === '/file') {
      next();
      return;
    }
    if (bundleExists) {
      res.sendFile(indexHtml);
      return;
    }
    res
      .status(503)
      .type('text/plain')
      .send(
        `query-ui bundle not found at ${staticDir}\n` +
          `Build it before launching: \`yarn build\` in packages/cli.\n` +
          `(API routes under /api/* are still available.)\n`
      );
  });

  return app;
}

export function startUIServer(opts: UIServerOptions): Promise<UIServerHandle> {
  return new Promise((resolve, reject) => {
    const app = buildUIApp(opts);
    const requestedPort = opts.port ?? 0;
    const server = app.listen(requestedPort, '127.0.0.1');
    server.once('error', reject);
    server.once('listening', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        reject(new Error('failed to bind UI server'));
        return;
      }
      const port = addr.port;
      resolve({
        server,
        port,
        url: `http://localhost:${port}/`,
        close: () =>
          new Promise<void>((rs, rj) => {
            server.close((err) => (err ? rj(err) : rs()));
          }),
      });
    });
  });
}

// ---- search query parser ------------------------------------------------
//
// Recognizes the apm-style structured filter syntax:
//   status:500  status:5xx
//   method:GET
//   path:/api
//   duration:>1s
//   class:UserController
//   function:save
//   label:log
//   table:widgets
//   sql:SELECT
//   branch:main  commit:<sha>  exception:NotFound
//   last:1h  since:<iso>  until:<iso>
//
// Everything not matching the `key:value` shape becomes free-text.

const FILTER_KEYS = new Set([
  'status', 'method', 'path', 'duration',
  'class', 'function', 'label', 'table', 'sql',
  'branch', 'commit', 'exception',
  'last', 'since', 'until', 'appmap',
]);

interface SearchFilters {
  text?: string;
  status?: string;
  method?: string;
  path?: string;
  duration?: string;
  class?: string;
  function?: string;
  label?: string;
  table?: string;
  sql?: string;
  branch?: string;
  commit?: string;
  exception?: string;
  since?: string;
  until?: string;
  appmap?: string;
}

export function parseSearchQuery(q: string): SearchFilters {
  const filters: SearchFilters = {};
  const text: string[] = [];

  for (const tok of q.split(/\s+/).filter(Boolean)) {
    const m = /^([a-zA-Z]+):(.+)$/.exec(tok);
    if (m && FILTER_KEYS.has(m[1].toLowerCase())) {
      const key = m[1].toLowerCase();
      let value = m[2];

      // status:5xx → status:>=500
      if (key === 'status' && /^[1-5]xx$/i.test(value)) {
        const family = value.charAt(0);
        filters.status = `>=${family}00`;
        continue;
      }
      // last:1h → since:<now - 1h>
      if (key === 'last') {
        try {
          filters.since = parseTime(`${value} ago`);
        } catch {
          // ignore unparseable values; agents/users often paste partials
        }
        continue;
      }
      (filters as Record<string, string>)[key] = value;
    } else {
      text.push(tok);
    }
  }

  if (text.length > 0) filters.text = text.join(' ');
  return filters;
}
