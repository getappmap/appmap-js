import sqlite3 from 'better-sqlite3';

import { openQueryDb } from '../../../../../src/cmds/query/db/openQueryDb';
import {
  buildMcpHandler,
  JsonRpcRequest,
  listResources,
  listResourceTemplates,
  listTools,
} from '../../../../../src/cmds/query/queries/mcp';

function freshDb(): sqlite3.Database {
  return openQueryDb('/tmp/ignored', ':memory:').db;
}

function seedMinimal(db: sqlite3.Database): void {
  // One recording with a request, a SQL query, an exception, and a labelled
  // function call — enough to exercise most tools.
  const am = db
    .prepare(
      `INSERT INTO appmaps (name, source_path, git_branch, sql_query_count, elapsed_ms, timestamp)
       VALUES ('rec', '/tmp/rec.appmap.json', 'main', 1, 100, '2026-04-29T12:00:00.000Z')`
    )
    .run();
  const id = am.lastInsertRowid;
  db.prepare(
    `INSERT INTO http_requests (appmap_id, event_id, parent_event_id, method, path, status_code, elapsed_ms)
     VALUES (?, 1, NULL, 'POST', '/orders', 500, 100)`
  ).run(id);
  db.prepare(
    `INSERT OR IGNORE INTO code_objects (fqid, package, classes, leaf_class, method, is_static)
     VALUES ('app/Logger#error', 'app', '["Logger"]', 'Logger', 'error', 0)`
  ).run();
  const co = (db
    .prepare(`SELECT id FROM code_objects WHERE fqid = 'app/Logger#error'`)
    .get() as { id: number }).id;
  db.prepare(`INSERT OR IGNORE INTO labels (code_object_id, label) VALUES (?, 'log')`).run(co);
  db.prepare(
    `INSERT INTO function_calls (appmap_id, event_id, parent_event_id, code_object_id,
       defined_class, method_id, elapsed_ms, parameters_json, return_value)
     VALUES (?, 2, 1, ?, 'Logger', 'error', 0.1,
       '[{"name":"message","class":"String","value":"connection refused"}]', NULL)`
  ).run(id, co);
  db.prepare(
    `INSERT INTO sql_queries (appmap_id, event_id, parent_event_id, sql_text, elapsed_ms)
     VALUES (?, 3, 2, 'INSERT INTO orders (id) VALUES (?)', 14)`
  ).run(id);
  // Exception's call entry is event_id=2 (the Logger.error call), and the
  // throw materialised at the return event id=4. with_logs uses event_id=2
  // as the call boundary and event_id=4 as the throw boundary.
  db.prepare(
    `INSERT INTO exceptions (appmap_id, event_id, return_event_id, parent_event_id,
      exception_class, message)
     VALUES (?, 2, 4, 1, 'IntegrityError', 'duplicate key')`
  ).run(id);
}

function call(handler: ReturnType<typeof buildMcpHandler>, msg: JsonRpcRequest) {
  const r = handler(msg);
  return r;
}

describe('MCP handler', () => {
  it('initialize returns server info and capabilities', () => {
    const db = freshDb();
    try {
      const r = call(buildMcpHandler(db), { jsonrpc: '2.0', id: 1, method: 'initialize' });
      expect(r).not.toBeNull();
      expect((r!.result as any).serverInfo.name).toBe('appmap-query');
      expect((r!.result as any).protocolVersion).toBeDefined();
      expect((r!.result as any).capabilities.tools).toBeDefined();
      expect((r!.result as any).capabilities.resources).toBeDefined();
    } finally {
      db.close();
    }
  });

  it('notifications/initialized returns null (notification, no response)', () => {
    const db = freshDb();
    try {
      const r = call(buildMcpHandler(db), {
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      });
      expect(r).toBeNull();
    } finally {
      db.close();
    }
  });

  it('tools/list returns the V3 tool surface', () => {
    const db = freshDb();
    try {
      const r = call(buildMcpHandler(db), { jsonrpc: '2.0', id: 2, method: 'tools/list' });
      const names = ((r!.result as any).tools as { name: string }[]).map((t) => t.name);
      expect(names).toEqual(
        expect.arrayContaining([
          'list_endpoints',
          'function_hotspots',
          'sql_hotspots',
          'list_labels',
          'find_recordings',
          'find_requests',
          'find_queries',
          'find_calls',
          'find_logs',
          'find_exceptions',
          'get_call_tree',
          'find_related',
          'compare_branches',
        ])
      );
    } finally {
      db.close();
    }
  });

  it('resources/list returns the appmap://endpoints resource', () => {
    const db = freshDb();
    try {
      const r = call(buildMcpHandler(db), { jsonrpc: '2.0', id: 3, method: 'resources/list' });
      const uris = ((r!.result as any).resources as { uri: string }[]).map((x) => x.uri);
      expect(uris).toContain('appmap://endpoints');
    } finally {
      db.close();
    }
  });

  it('unknown method → -32601 method-not-found', () => {
    const db = freshDb();
    try {
      const r = call(buildMcpHandler(db), { jsonrpc: '2.0', id: 4, method: 'no/such/method' });
      expect(r!.error?.code).toBe(-32601);
    } finally {
      db.close();
    }
  });

  it('tools/call to an unknown tool → -32601', () => {
    const db = freshDb();
    try {
      const r = call(buildMcpHandler(db), {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'no_such_tool', arguments: {} },
      });
      expect(r!.error?.code).toBe(-32601);
    } finally {
      db.close();
    }
  });

  it('tools/call with missing arguments object → -32602 invalid params', () => {
    const db = freshDb();
    try {
      const r = call(buildMcpHandler(db), {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'compare_branches',
          arguments: {
            sort: 'invalid_sort_value', // invalid value for an enum-typed argument
          },
        },
      });
      expect(r!.error?.code).toBe(-32602);
    } finally {
      db.close();
    }
  });

  it('tools/call wraps the result as a content block of type=text', () => {
    const db = freshDb();
    try {
      seedMinimal(db);
      const r = call(buildMcpHandler(db), {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'find_exceptions', arguments: { limit: 10 } },
      });
      const content = (r!.result as any).content;
      expect(Array.isArray(content)).toBe(true);
      expect(content[0].type).toBe('text');
      const parsed = JSON.parse(content[0].text);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].exception_class).toBe('IntegrityError');
    } finally {
      db.close();
    }
  });

  it('get_call_tree resolves appmap (numeric id or name) and applies focus_type', () => {
    const db = freshDb();
    try {
      seedMinimal(db);
      const handler = buildMcpHandler(db);

      // Numeric id.
      const byId = call(handler, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: {
          name: 'get_call_tree',
          arguments: { appmap: 1, focus_type: 'sql_query', focus_value: 'INSERT INTO orders' },
        },
      });
      const idRows = JSON.parse((byId!.result as any).content[0].text);
      expect(Array.isArray(idRows)).toBe(true);
      expect(idRows.some((n: any) => n.kind === 'sql')).toBe(true);

      // Name-based ref.
      const byName = call(handler, {
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/call',
        params: {
          name: 'get_call_tree',
          arguments: { appmap: 'rec' },
        },
      });
      const nameRows = JSON.parse((byName!.result as any).content[0].text);
      expect(Array.isArray(nameRows)).toBe(true);
    } finally {
      db.close();
    }
  });

  it('list_labels returns labels with counts and a sample fqid', () => {
    const db = freshDb();
    try {
      seedMinimal(db);
      const r = call(buildMcpHandler(db), {
        jsonrpc: '2.0',
        id: 90,
        method: 'tools/call',
        params: { name: 'list_labels', arguments: {} },
      });
      const rows = JSON.parse((r!.result as any).content[0].text);
      expect(rows).toEqual([{ label: 'log', count: 1, sample_fqid: 'app/Logger#error' }]);
    } finally {
      db.close();
    }
  });

  it('find_logs returns label=log calls and filters by --message', () => {
    const db = freshDb();
    try {
      seedMinimal(db);
      // Add a parameters_json + return_value to the seeded log call so
      // --message has something to LIKE against.
      db.prepare(
        `UPDATE function_calls
            SET parameters_json = ?, return_value = ?
            WHERE method_id = 'error'`
      ).run(
        JSON.stringify([{ name: 'message', class: 'String', value: 'connection refused' }]),
        null
      );
      const handler = buildMcpHandler(db);

      // No filter: returns the log row.
      const all = call(handler, {
        jsonrpc: '2.0',
        id: 100,
        method: 'tools/call',
        params: { name: 'find_logs', arguments: {} },
      });
      const allRows = JSON.parse((all!.result as any).content[0].text);
      expect(allRows).toHaveLength(1);
      expect(allRows[0].logger).toBe('Logger');
      expect(allRows[0].method_id).toBe('error');
      expect(allRows[0].parameters_json).toContain('connection refused');

      // Substring filter against parameters_json.
      const matched = call(handler, {
        jsonrpc: '2.0',
        id: 101,
        method: 'tools/call',
        params: { name: 'find_logs', arguments: { message: 'refused' } },
      });
      expect(JSON.parse((matched!.result as any).content[0].text)).toHaveLength(1);

      // Substring that doesn't appear: zero rows.
      const empty = call(handler, {
        jsonrpc: '2.0',
        id: 102,
        method: 'tools/call',
        params: { name: 'find_logs', arguments: { message: 'this never appears' } },
      });
      expect(JSON.parse((empty!.result as any).content[0].text)).toHaveLength(0);
    } finally {
      db.close();
    }
  });

  it('find_exceptions with_logs attaches recent_logs', () => {
    const db = freshDb();
    try {
      seedMinimal(db);
      // Give the seeded log call a message so recent_logs has content.
      db.prepare(
        `UPDATE function_calls
            SET parameters_json = ?
            WHERE method_id = 'error'`
      ).run(
        JSON.stringify([{ name: 'message', class: 'String', value: 'connection refused' }])
      );
      const handler = buildMcpHandler(db);

      // No with_logs: recent_logs is absent.
      const noLogs = call(handler, {
        jsonrpc: '2.0',
        id: 200,
        method: 'tools/call',
        params: { name: 'find_exceptions', arguments: {} },
      });
      const noLogsRows = JSON.parse((noLogs!.result as any).content[0].text);
      expect(noLogsRows[0].recent_logs).toBeUndefined();
      // appmap_id is now exposed.
      expect(typeof noLogsRows[0].appmap_id).toBe('number');

      // with_logs=5: recent_logs is present and non-empty (the seed has
      // a log call at event 2, exception at event 2 — the log shares the
      // event_id with the exception so it doesn't qualify; verify the
      // shape regardless).
      const withLogsRes = call(handler, {
        jsonrpc: '2.0',
        id: 201,
        method: 'tools/call',
        params: { name: 'find_exceptions', arguments: { with_logs: 5 } },
      });
      const withLogsRows = JSON.parse((withLogsRes!.result as any).content[0].text);
      expect(Array.isArray(withLogsRows[0].recent_logs)).toBe(true);
    } finally {
      db.close();
    }
  });

  it('find_logs row carries a derived message field', () => {
    const db = freshDb();
    try {
      seedMinimal(db);
      const r = call(buildMcpHandler(db), {
        jsonrpc: '2.0',
        id: 91,
        method: 'tools/call',
        params: { name: 'find_logs', arguments: {} },
      });
      const rows = JSON.parse((r!.result as any).content[0].text);
      expect(rows).toHaveLength(1);
      expect(rows[0].message).toBe('connection refused');
      expect(rows[0].logger).toBe('Logger');
      expect(rows[0].parameters_json).toContain('connection refused');
    } finally {
      db.close();
    }
  });

  it('find_exceptions with_logs uses return_event_id for ordering (regression)', () => {
    const db = freshDb();
    try {
      seedMinimal(db);
      const r = call(buildMcpHandler(db), {
        jsonrpc: '2.0',
        id: 92,
        method: 'tools/call',
        params: { name: 'find_exceptions', arguments: { with_logs: 5 } },
      });
      const rows = JSON.parse((r!.result as any).content[0].text);
      expect(rows).toHaveLength(1);
      expect(rows[0].return_event_id).toBe(4);
      // Pre-fix the with_logs SQL filtered by `event_id < exception.event_id`
      // (=2), which excluded the Logger.error log call at event_id=2 entirely.
      // With return_event_id (=4) as the upper bound, the log call (event 2)
      // is included — that's the regression we're guarding against.
      expect(rows[0].recent_logs).toHaveLength(1);
      expect(rows[0].recent_logs[0].event_id).toBe(2);
      expect(rows[0].recent_logs[0].message).toBe('connection refused');
    } finally {
      db.close();
    }
  });

  it('find_calls --label filters by the AppMap label', () => {
    const db = freshDb();
    try {
      seedMinimal(db);
      const r = call(buildMcpHandler(db), {
        jsonrpc: '2.0',
        id: 9,
        method: 'tools/call',
        params: { name: 'find_calls', arguments: { label: 'log' } },
      });
      const rows = JSON.parse((r!.result as any).content[0].text);
      expect(rows).toHaveLength(1);
      expect(rows[0].method_id).toBe('error');
    } finally {
      db.close();
    }
  });

  it('list_endpoints / function_hotspots / sql_hotspots produce expected rows', () => {
    const db = freshDb();
    try {
      seedMinimal(db);
      const handler = buildMcpHandler(db);

      const ep = call(handler, {
        jsonrpc: '2.0',
        id: 11,
        method: 'tools/call',
        params: { name: 'list_endpoints', arguments: {} },
      });
      const epRows = JSON.parse((ep!.result as any).content[0].text);
      expect(epRows[0].route).toBe('/orders');

      const fh = call(handler, {
        jsonrpc: '2.0',
        id: 12,
        method: 'tools/call',
        params: { name: 'function_hotspots', arguments: { limit: 5 } },
      });
      expect(JSON.parse((fh!.result as any).content[0].text).length).toBeGreaterThan(0);

      const sh = call(handler, {
        jsonrpc: '2.0',
        id: 13,
        method: 'tools/call',
        params: { name: 'sql_hotspots', arguments: { limit: 5 } },
      });
      expect(JSON.parse((sh!.result as any).content[0].text).length).toBeGreaterThan(0);
    } finally {
      db.close();
    }
  });

  it('resources/read returns the endpoints summary as JSON', () => {
    const db = freshDb();
    try {
      seedMinimal(db);
      const r = call(buildMcpHandler(db), {
        jsonrpc: '2.0',
        id: 10,
        method: 'resources/read',
        params: { uri: 'appmap://endpoints' },
      });
      const contents = (r!.result as any).contents;
      expect(contents[0].uri).toBe('appmap://endpoints');
      const parsed = JSON.parse(contents[0].text);
      expect(parsed[0].route).toBe('/orders');
    } finally {
      db.close();
    }
  });

  it('listTools / listResources / listResourceTemplates are stable for documentation use', () => {
    expect(listTools().length).toBeGreaterThan(0);
    expect(listResources().length).toBeGreaterThan(0);
    expect(listResourceTemplates().length).toBeGreaterThan(0);
  });

  it('resources/templates/list advertises the per-recording logs template', () => {
    const db = freshDb();
    try {
      const r = call(buildMcpHandler(db), {
        jsonrpc: '2.0',
        id: 300,
        method: 'resources/templates/list',
      });
      const templates = (r!.result as any).resourceTemplates as { uriTemplate: string }[];
      expect(templates.some((t) => t.uriTemplate === 'appmap://recording/{ref}/logs')).toBe(
        true
      );
    } finally {
      db.close();
    }
  });

  it('resources/read on appmap://recording/<name>/logs returns the recording\'s log rows', () => {
    const db = freshDb();
    try {
      seedMinimal(db);
      // Give the seeded log call a captured message.
      db.prepare(
        `UPDATE function_calls
            SET parameters_json = ?
            WHERE method_id = 'error'`
      ).run(
        JSON.stringify([{ name: 'message', class: 'String', value: 'connection refused' }])
      );

      const r = call(buildMcpHandler(db), {
        jsonrpc: '2.0',
        id: 301,
        method: 'resources/read',
        params: { uri: 'appmap://recording/rec/logs' },
      });
      const contents = (r!.result as any).contents;
      expect(contents[0].uri).toBe('appmap://recording/rec/logs');
      const rows = JSON.parse(contents[0].text);
      expect(rows).toHaveLength(1);
      expect(rows[0].logger).toBe('Logger');
      expect(rows[0].method_id).toBe('error');
    } finally {
      db.close();
    }
  });

  it('resources/read on a recording-logs URI with an unknown ref returns an error', () => {
    const db = freshDb();
    try {
      const r = call(buildMcpHandler(db), {
        jsonrpc: '2.0',
        id: 302,
        method: 'resources/read',
        params: { uri: 'appmap://recording/no-such-recording/logs' },
      });
      expect(r!.error).toBeDefined();
      expect(r!.error!.message).toMatch(/appmap not found/);
    } finally {
      db.close();
    }
  });

  it('resources/read on a URI that matches no resource or template returns an error', () => {
    const db = freshDb();
    try {
      const r = call(buildMcpHandler(db), {
        jsonrpc: '2.0',
        id: 303,
        method: 'resources/read',
        params: { uri: 'appmap://nope' },
      });
      expect(r!.error).toBeDefined();
      expect(r!.error!.message).toMatch(/unknown resource/);
    } finally {
      db.close();
    }
  });
});
