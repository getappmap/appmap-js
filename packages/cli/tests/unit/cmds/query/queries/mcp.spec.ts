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
      expect(parsed.rows).toHaveLength(1);
      expect(parsed.total).toBe(1);
      expect(parsed.rows[0].exception_class).toBe('IntegrityError');
    } finally {
      db.close();
    }
  });

  it('get_call_tree resolves the canonical appmap path and applies focus_type', () => {
    const db = freshDb();
    try {
      seedMinimal(db);
      const handler = buildMcpHandler(db);

      // Look up the canonical path via find_recordings, then call
      // get_call_tree with that exact value. This is the round-trip
      // the API contract documents.
      const list = call(handler, {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'find_recordings', arguments: {} },
      });
      const path = JSON.parse((list!.result as any).content[0].text).rows[0].path;

      const r = call(handler, {
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/call',
        params: {
          name: 'get_call_tree',
          arguments: { appmap: path, focus_type: 'sql_query', focus_value: 'INSERT INTO orders' },
        },
      });
      const result = JSON.parse((r!.result as any).content[0].text);
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(result.nodes.some((n: any) => n.kind === 'sql')).toBe(true);
      expect(typeof result.truncated).toBe('boolean');
      expect(typeof result.max_depth_reached).toBe('number');
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
      expect(allRows.rows).toHaveLength(1);
      expect(allRows.rows[0].logger).toBe('Logger');
      expect(allRows.rows[0].method_id).toBe('error');
      expect(allRows.rows[0].parameters_json).toContain('connection refused');

      // Substring filter against parameters_json.
      const matched = call(handler, {
        jsonrpc: '2.0',
        id: 101,
        method: 'tools/call',
        params: { name: 'find_logs', arguments: { message: 'refused' } },
      });
      expect(JSON.parse((matched!.result as any).content[0].text).rows).toHaveLength(1);

      // Substring that doesn't appear: zero rows.
      const empty = call(handler, {
        jsonrpc: '2.0',
        id: 102,
        method: 'tools/call',
        params: { name: 'find_logs', arguments: { message: 'this never appears' } },
      });
      expect(JSON.parse((empty!.result as any).content[0].text).rows).toHaveLength(0);
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
      expect(noLogsRows.rows[0].recent_logs).toBeUndefined();
      // appmap_id is now exposed.
      expect(typeof noLogsRows.rows[0].appmap_id).toBe('number');

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
      expect(Array.isArray(withLogsRows.rows[0].recent_logs)).toBe(true);
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
      const page = JSON.parse((r!.result as any).content[0].text);
      expect(page.rows).toHaveLength(1);
      expect(page.rows[0].message).toBe('connection refused');
      expect(page.rows[0].logger).toBe('Logger');
      expect(page.rows[0].parameters_json).toContain('connection refused');
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
      const page = JSON.parse((r!.result as any).content[0].text);
      expect(page.rows).toHaveLength(1);
      expect(page.rows[0].return_event_id).toBe(4);
      // Pre-fix the with_logs SQL filtered by `event_id < exception.event_id`
      // (=2), which excluded the Logger.error log call at event_id=2 entirely.
      // With return_event_id (=4) as the upper bound, the log call (event 2)
      // is included — that's the regression we're guarding against.
      expect(page.rows[0].recent_logs).toHaveLength(1);
      expect(page.rows[0].recent_logs[0].event_id).toBe(2);
      expect(page.rows[0].recent_logs[0].message).toBe('connection refused');
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
      const page = JSON.parse((r!.result as any).content[0].text);
      expect(page.rows).toHaveLength(1);
      expect(page.rows[0].method_id).toBe('error');
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
      const epPage = JSON.parse((ep!.result as any).content[0].text);
      expect(epPage.rows[0].route).toBe('/orders');

      const fh = call(handler, {
        jsonrpc: '2.0',
        id: 12,
        method: 'tools/call',
        params: { name: 'function_hotspots', arguments: { limit: 5 } },
      });
      expect(JSON.parse((fh!.result as any).content[0].text).rows.length).toBeGreaterThan(0);

      const sh = call(handler, {
        jsonrpc: '2.0',
        id: 13,
        method: 'tools/call',
        params: { name: 'sql_hotspots', arguments: { limit: 5 } },
      });
      expect(JSON.parse((sh!.result as any).content[0].text).rows.length).toBeGreaterThan(0);
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
      expect(parsed.rows[0].route).toBe('/orders');
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

  it('resources/read on appmap://recording/<encoded-path>/logs returns the recording\'s log rows', () => {
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

      // {ref} is the canonical path (the absolute source_path). Since
      // it contains slashes, the URI segment is URL-encoded.
      const sourcePath = '/tmp/rec.appmap.json';
      const uri = `appmap://recording/${encodeURIComponent(sourcePath)}/logs`;
      const r = call(buildMcpHandler(db), {
        jsonrpc: '2.0',
        id: 301,
        method: 'resources/read',
        params: { uri },
      });
      const contents = (r!.result as any).contents;
      expect(contents[0].uri).toBe(uri);
      const page = JSON.parse(contents[0].text);
      expect(page.rows).toHaveLength(1);
      expect(page.rows[0].logger).toBe('Logger');
      expect(page.rows[0].method_id).toBe('error');
    } finally {
      db.close();
    }
  });

  it('resources/read on a recording-logs URI with an unknown path returns an error', () => {
    const db = freshDb();
    try {
      const uri = `appmap://recording/${encodeURIComponent('/no/such/recording.appmap.json')}/logs`;
      const r = call(buildMcpHandler(db), {
        jsonrpc: '2.0',
        id: 302,
        method: 'resources/read',
        params: { uri },
      });
      expect(r!.error).toBeDefined();
      expect(r!.error!.message).toMatch(/not found at path/);
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

  // --- Spec 01: canonical path identifier ---------------------------------

  describe('Spec 01: canonical path identifier', () => {
    function seedTwo(db: sqlite3.Database): void {
      // Two recordings rooted at /tmp/proj — one junit, one request — so
      // we can verify path/kind derivation and alias equivalence.
      db.prepare(
        `INSERT INTO appmaps (name, source_path, git_branch, sql_query_count, elapsed_ms, timestamp)
         VALUES ('JunitTest_method_x', '/tmp/proj/tmp/appmap/junit/JunitTest_method_x.appmap.json',
                 'main', 0, 100, '2026-04-29T12:00:00.000Z')`
      ).run();
      db.prepare(
        `INSERT INTO appmaps (name, source_path, git_branch, sql_query_count, elapsed_ms, timestamp)
         VALUES ('1779_post_orders', '/tmp/proj/tmp/appmap/request_recording/1779_post_orders.appmap.json',
                 'main', 0, 50,  '2026-04-29T12:00:01.000Z')`
      ).run();
    }

    it('find_recordings rows expose path = absolute source_path, plus label and kind', () => {
      const db = freshDb();
      try {
        seedTwo(db);
        const r = call(buildMcpHandler(db), {
          jsonrpc: '2.0',
          id: 400,
          method: 'tools/call',
          params: { name: 'find_recordings', arguments: {} },
        });
        const page = JSON.parse((r!.result as any).content[0].text);
        expect(page.rows).toHaveLength(2);
        const byKind = Object.fromEntries(page.rows.map((row: any) => [row.kind, row]));
        expect(byKind.junit.path).toBe(
          '/tmp/proj/tmp/appmap/junit/JunitTest_method_x.appmap.json'
        );
        expect(byKind.junit.path).toBe(byKind.junit.source_path);
        expect(byKind.junit.label).toBe('JunitTest_method_x');
        expect(byKind.request.path).toBe(
          '/tmp/proj/tmp/appmap/request_recording/1779_post_orders.appmap.json'
        );
        expect(byKind.request.kind).toBe('request');
      } finally {
        db.close();
      }
    });

    it('get_call_tree only accepts the canonical path; name / numeric id return a "not found" hint', () => {
      const db = freshDb();
      try {
        seedTwo(db);
        const handler = buildMcpHandler(db);
        const list = call(handler, {
          jsonrpc: '2.0',
          id: 401,
          method: 'tools/call',
          params: { name: 'find_recordings', arguments: {} },
        });
        const junit = JSON.parse((list!.result as any).content[0].text).rows.find(
          (row: any) => row.kind === 'junit'
        );

        // Canonical path: succeeds.
        const ok = call(handler, {
          jsonrpc: '2.0',
          id: 402,
          method: 'tools/call',
          params: { name: 'get_call_tree', arguments: { appmap: junit.path } },
        });
        expect(ok!.error).toBeUndefined();
        expect(JSON.parse((ok!.result as any).content[0].text).nodes).toBeDefined();

        // Recording name: rejected.
        const byName = call(handler, {
          jsonrpc: '2.0',
          id: 403,
          method: 'tools/call',
          params: { name: 'get_call_tree', arguments: { appmap: junit.appmap_name } },
        });
        expect(byName!.error).toBeDefined();
        expect(byName!.error!.message).toMatch(/not found at path/);

        // Numeric id: rejected.
        const byId = call(handler, {
          jsonrpc: '2.0',
          id: 404,
          method: 'tools/call',
          params: { name: 'get_call_tree', arguments: { appmap: String(junit.appmap_id) } },
        });
        expect(byId!.error).toBeDefined();
        expect(byId!.error!.message).toMatch(/not found at path/);
      } finally {
        db.close();
      }
    });

    it('find_calls attaches did_you_mean diagnostic on empty results', () => {
      const db = freshDb();
      try {
        seedMinimal(db);
        // Seed an Impl whose class is *not* a substring of the user's
        // probe — only Levenshtein/component scoring should connect them.
        db.prepare(
          `INSERT INTO code_objects (fqid, package, classes, leaf_class, method, is_static)
           VALUES ('app/PaymentServiceImpl#submit', 'app',
                   '["PaymentServiceImpl"]', 'PaymentServiceImpl', 'submit', 0)`
        ).run();
        const co = (db
          .prepare(`SELECT id FROM code_objects WHERE fqid = 'app/PaymentServiceImpl#submit'`)
          .get() as { id: number }).id;
        db.prepare(
          `INSERT INTO function_calls (appmap_id, event_id, code_object_id, defined_class, method_id)
           VALUES (1, 99, ?, 'PaymentServiceImpl', 'submit')`
        ).run(co);

        // Use a class that won't substring-match any leaf_class — substring
        // is the existing behavior for find_calls, so the diagnostic only
        // fires when no class match is found at all.
        const r = call(buildMcpHandler(db), {
          jsonrpc: '2.0',
          id: 410,
          method: 'tools/call',
          params: { name: 'find_calls', arguments: { class: 'PmtSvc', method: 'submit' } },
        });
        const page = JSON.parse((r!.result as any).content[0].text);
        expect(page.rows).toHaveLength(0);
        expect(page.diagnostic).toBeDefined();
        expect(
          page.diagnostic.did_you_mean.some(
            (d: any) => d.function_id === 'app/PaymentServiceImpl#submit'
          )
        ).toBe(true);
      } finally {
        db.close();
      }
    });

    it('find_calls omits diagnostic when matches are non-empty', () => {
      const db = freshDb();
      try {
        seedMinimal(db);
        const r = call(buildMcpHandler(db), {
          jsonrpc: '2.0',
          id: 411,
          method: 'tools/call',
          params: { name: 'find_calls', arguments: { class: 'Logger' } },
        });
        const page = JSON.parse((r!.result as any).content[0].text);
        expect(page.rows.length).toBeGreaterThan(0);
        expect(page.diagnostic).toBeUndefined();
      } finally {
        db.close();
      }
    });

    it('get_call_tree resolves cleanly when duplicate-basename recordings share a name (path is unambiguous)', () => {
      // Regression: when a sticky/widened indexer scan leaves two
      // recordings with the same basename and name in the DB — one at
      // /tmp/proj, the other at /var/elsewhere — passing the absolute
      // `path` field returned by find_recordings must resolve to that
      // exact row (source_path is UNIQUE in the schema). Bare names
      // are rejected outright by the strict resolver, with a hint
      // pointing the caller back at the path field.
      const db = freshDb();
      try {
        db.prepare(
          `INSERT INTO appmaps (name, source_path, git_branch, sql_query_count, elapsed_ms, timestamp)
           VALUES ('foo', '/tmp/proj/tmp/appmap/junit/foo.appmap.json',
                   'main', 0, 100, '2026-04-29T12:00:00.000Z')`
        ).run();
        db.prepare(
          `INSERT INTO appmaps (name, source_path, git_branch, sql_query_count, elapsed_ms, timestamp)
           VALUES ('foo', '/var/elsewhere/tmp/appmap/junit/foo.appmap.json',
                   'main', 0, 100, '2026-04-29T12:00:00.000Z')`
        ).run();
        db.prepare(
          `INSERT INTO http_requests (appmap_id, event_id, parent_event_id, method, path, status_code, elapsed_ms)
           VALUES (1, 1, NULL, 'GET', '/x', 200, 1)`
        ).run();

        const handler = buildMcpHandler(db);
        // Absolute path: resolves cleanly.
        const ok = call(handler, {
          jsonrpc: '2.0',
          id: 420,
          method: 'tools/call',
          params: {
            name: 'get_call_tree',
            arguments: { appmap: '/tmp/proj/tmp/appmap/junit/foo.appmap.json' },
          },
        });
        expect(ok!.error).toBeUndefined();

        // Bare name: rejected with a hint to use the path field.
        const reject = call(handler, {
          jsonrpc: '2.0',
          id: 421,
          method: 'tools/call',
          params: { name: 'get_call_tree', arguments: { appmap: 'foo' } },
        });
        expect(reject!.error).toBeDefined();
        expect(reject!.error!.message).toMatch(/not found at path/);
        expect(reject!.error!.message).toMatch(/find_recordings/);
      } finally {
        db.close();
      }
    });

    it('get_call_tree rejects display-label refs with a hint', () => {
      const db = freshDb();
      try {
        seedTwo(db);
        const r = call(buildMcpHandler(db), {
          jsonrpc: '2.0',
          id: 403,
          method: 'tools/call',
          params: {
            name: 'get_call_tree',
            arguments: { appmap: 'POST /orders (200) - 19:47:22.660' },
          },
        });
        expect(r!.error).toBeDefined();
        expect(r!.error!.message).toMatch(/display label/);
        expect(r!.error!.message).toMatch(/find_recordings/);
      } finally {
        db.close();
      }
    });
  });

  describe('get_call_tree default selection', () => {
    function seedRecording(
      db: sqlite3.Database,
      opts: { recorderType: string; eventCount: number; httpRequestCount?: number; sourcePath?: string }
    ): { id: number; path: string } {
      const path = opts.sourcePath ?? '/tmp/auto.appmap.json';
      const am = db
        .prepare(
          `INSERT INTO appmaps (name, source_path, recorder_type, event_count, http_request_count, sql_query_count, elapsed_ms, timestamp)
           VALUES ('auto', ?, ?, ?, ?, 0, 50, '2026-04-29T12:00:00.000Z')`
        )
        .run(path, opts.recorderType, opts.eventCount, opts.httpRequestCount ?? 0);
      // Add at least one event so tree() returns something. The
      // recorded event_count above is what the heuristic reads — the
      // actual rows can be sparse for tests that don't care about depth.
      db.prepare(
        `INSERT INTO function_calls (appmap_id, event_id, parent_event_id, defined_class, method_id, path, lineno, elapsed_ms)
         VALUES (?, 1, NULL, 'App', 'main', '/src/App.java', 1, 5)`
      ).run(am.lastInsertRowid);
      return { id: Number(am.lastInsertRowid), path };
    }

    it('auto-selects child_depth=2 on broad recordings (event_count > 500)', () => {
      const db = freshDb();
      try {
        const { path } = seedRecording(db, { recorderType: 'tests', eventCount: 1500 });
        const r = call(buildMcpHandler(db), {
          jsonrpc: '2.0',
          id: 500,
          method: 'tools/call',
          params: { name: 'get_call_tree', arguments: { appmap: path } },
        });
        const out = JSON.parse((r!.result as any).content[0].text);
        expect(out.chosen_params).toEqual({
          parent_depth: null,
          child_depth: 2,
          focus_type: null,
          focus_value: null,
        });
        expect(out.reason).toMatch(/1500 events/);
        expect(out.reason).toMatch(/child_depth=2/);
      } finally {
        db.close();
      }
    });

    it('keeps default child_depth on narrow per-request recordings', () => {
      const db = freshDb();
      try {
        const { path } = seedRecording(db, {
          recorderType: 'http_server_request',
          eventCount: 5000,
          httpRequestCount: 1,
        });
        const r = call(buildMcpHandler(db), {
          jsonrpc: '2.0',
          id: 501,
          method: 'tools/call',
          params: { name: 'get_call_tree', arguments: { appmap: path } },
        });
        const out = JSON.parse((r!.result as any).content[0].text);
        // Narrow recordings keep the existing default — chosen child_depth
        // is undefined here because the user didn't supply one and the
        // heuristic didn't pre-select one. tree() applies its own default
        // (DEFAULT_DESCENDANTS=4) internally.
        expect(out.chosen_params.child_depth).toBeNull();
        expect(out.chosen_params.focus_type).toBeNull();
        expect(out.reason).toBeUndefined();
      } finally {
        db.close();
      }
    });

    it('keeps default child_depth on small recordings regardless of recorder_type', () => {
      const db = freshDb();
      try {
        const { path } = seedRecording(db, { recorderType: 'tests', eventCount: 100 });
        const r = call(buildMcpHandler(db), {
          jsonrpc: '2.0',
          id: 502,
          method: 'tools/call',
          params: { name: 'get_call_tree', arguments: { appmap: path } },
        });
        const out = JSON.parse((r!.result as any).content[0].text);
        expect(out.chosen_params.child_depth).toBeNull();
        expect(out.reason).toBeUndefined();
      } finally {
        db.close();
      }
    });

    it('respects explicit child_depth even on broad recordings', () => {
      const db = freshDb();
      try {
        const { path } = seedRecording(db, { recorderType: 'tests', eventCount: 1500 });
        const r = call(buildMcpHandler(db), {
          jsonrpc: '2.0',
          id: 503,
          method: 'tools/call',
          params: { name: 'get_call_tree', arguments: { appmap: path, child_depth: 6 } },
        });
        const out = JSON.parse((r!.result as any).content[0].text);
        expect(out.chosen_params.child_depth).toBe(6);
        // The auto-reason is suppressed when the user specified the value.
        expect(out.reason).toBeUndefined();
      } finally {
        db.close();
      }
    });

    it('returns a diagnostic when focus excludes everything', () => {
      const db = freshDb();
      try {
        // junit recording with no http server requests; agent tries to
        // focus on http_server_request and gets nothing back.
        const { path } = seedRecording(db, {
          recorderType: 'tests',
          eventCount: 100,
          httpRequestCount: 0,
        });
        const r = call(buildMcpHandler(db), {
          jsonrpc: '2.0',
          id: 504,
          method: 'tools/call',
          params: {
            name: 'get_call_tree',
            arguments: { appmap: path, focus_type: 'http_server_request', focus_value: '/anything' },
          },
        });
        const out = JSON.parse((r!.result as any).content[0].text);
        expect(out.nodes).toEqual([]);
        expect(out.diagnostic).toMatch(/no events of type 'http_server_request'/);
        expect(out.diagnostic).toMatch(/recorder_type=tests/);
        expect(out.diagnostic).toMatch(/no HTTP server requests/);
        expect(out.chosen_params.focus_type).toBe('http_server_request');
      } finally {
        db.close();
      }
    });

    it('falls back to summary_mode when the response would exceed the budget', () => {
      const db = freshDb();
      try {
        // Insert one entry-point HTTP request + many fat function calls
        // so the JSON serialization easily clears RESPONSE_BUDGET_CHARS
        // (40_000). Each row carries a kilobyte of parameters_json so we
        // hit the budget without seeding tens of thousands of rows.
        const am = db
          .prepare(
            `INSERT INTO appmaps (name, source_path, recorder_type, event_count, http_request_count, sql_query_count, elapsed_ms, timestamp)
             VALUES ('big', '/tmp/big.appmap.json', 'tests', 5000, 1, 0, 5000, '2026-04-29T12:00:00.000Z')`
          )
          .run();
        const id = am.lastInsertRowid;
        db.prepare(
          `INSERT INTO http_requests (appmap_id, event_id, parent_event_id, method, path, status_code, elapsed_ms)
           VALUES (?, 1, NULL, 'GET', '/api/big', 200, 5000)`
        ).run(id);
        const big = 'x'.repeat(1024);
        for (let i = 2; i < 100; i += 1) {
          db.prepare(
            `INSERT INTO function_calls (appmap_id, event_id, parent_event_id, defined_class, method_id, path, lineno, elapsed_ms, parameters_json)
             VALUES (?, ?, 1, 'C', 'm', '/src/C.java', ?, ?, ?)`
          ).run(id, i, i, i, JSON.stringify([{ value: big }]));
        }
        const r = call(buildMcpHandler(db), {
          jsonrpc: '2.0',
          id: 505,
          method: 'tools/call',
          params: { name: 'get_call_tree', arguments: { appmap: '/tmp/big.appmap.json' } },
        });
        const out = JSON.parse((r!.result as any).content[0].text);
        expect(out.summary_mode).toBe(true);
        expect(out.nodes.some((n: any) => n.kind === 'http_server')).toBe(true);
        expect(out.nodes.some((n: any) => n.kind === 'function')).toBe(false);
        expect(Array.isArray(out.suggested_drilldown)).toBe(true);
        expect(out.suggested_drilldown.length).toBeGreaterThan(0);
        expect(out.suggested_drilldown[0]).toEqual(
          expect.objectContaining({
            event_id: expect.any(Number),
            elapsed_ms: expect.any(Number),
            child_count: expect.any(Number),
          })
        );
        // Drilldown is sorted by elapsed_ms desc.
        const elapsed: number[] = out.suggested_drilldown.map((d: any) => d.elapsed_ms);
        for (let i = 1; i < elapsed.length; i += 1) {
          expect(elapsed[i - 1]).toBeGreaterThanOrEqual(elapsed[i]);
        }
        expect(out.reason).toMatch(/over the .*-char budget/);
      } finally {
        db.close();
      }
    });
  });
});
