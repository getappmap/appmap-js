import { BUILTIN_ALLOW, sanitizeAppMap, ValueMasker } from '../../../src/lib/sanitizeAppMap';

const param = (name: string, value: string, klass = 'String') => ({ name, class: klass, value });

describe('sanitizeAppMap', () => {
  it('replaces values with per-file tokens, preserving equality within the AppMap', () => {
    const appmap = {
      events: [
        {
          parameters: [param('token', 'sekrit-abc'), param('user', 'alice@example.com')],
          return_value: { class: 'String', value: 'sekrit-abc' },
        },
      ],
    };
    sanitizeAppMap(appmap);
    const [p1, p2] = appmap.events[0].parameters;
    expect(p1.value).toEqual('<v1>');
    expect(p2.value).toEqual('<v2>');
    expect(appmap.events[0].return_value.value).toEqual('<v1>'); // same string, same token
  });

  it('shares the token namespace across all value positions', () => {
    const appmap = {
      events: [
        {
          parameters: [param('auth', 'bearer-xyz')],
          http_server_request: {
            request_method: 'POST',
            path_info: '/games/123/join',
            normalized_path_info: '/games/:id/join',
            headers: { Authorization: 'bearer-xyz', 'Content-Type': 'application/json' },
          },
        },
      ],
    };
    sanitizeAppMap(appmap);
    const event = appmap.events[0];
    expect(event.parameters[0].value).toEqual('<v1>');
    expect(event.http_server_request.headers.Authorization).toEqual('<v1>');
    expect(event.http_server_request.headers['Content-Type']).not.toEqual('application/json');
    expect(Object.keys(event.http_server_request.headers)).toEqual([
      'Authorization',
      'Content-Type',
    ]); // header names are schema, kept
    expect(event.http_server_request.normalized_path_info).toEqual('/games/:id/join'); // route template kept
    expect(event.http_server_request.path_info).toMatch(/^<v\d+>$/); // concrete path tokenized
    expect(event.http_server_request.request_method).toEqual('POST');
  });

  it('keeps built-in enumerable values and user-allowed vocabularies verbatim', () => {
    const allow = new Set([...BUILTIN_ALLOW, 'private', 'public']);
    const appmap = {
      events: [
        {
          parameters: [
            param('is_private', 'true'),
            param('visibility', 'private'),
            param('name', 'privateer'), // contains an allowed word — not an exact match
          ],
        },
      ],
    };
    sanitizeAppMap(appmap, new ValueMasker(allow));
    const [p1, p2, p3] = appmap.events[0].parameters;
    expect(p1.value).toEqual('true');
    expect(p2.value).toEqual('private');
    expect(p3.value).toMatch(/^<v\d+>$/);
  });

  it('annotates tokens with the recognized shape, without retaining content', () => {
    const appmap = {
      events: [
        {
          parameters: [
            param('id', '0f5e2b1a-9c4d-4e6f-8a7b-1c2d3e4f5a6b'),
            param('count', '42'),
            param('at', '2026-07-07T12:00:00Z'),
            param('digest', 'deadbeefdeadbeefdeadbeef'),
          ],
        },
      ],
    };
    sanitizeAppMap(appmap);
    const values = appmap.events[0].parameters.map((p) => p.value);
    expect(values).toEqual(['<uuid:v1>', '<int:v2>', '<iso8601:v3>', '<hex:v4>']);
  });

  it('is idempotent', () => {
    const appmap = {
      events: [
        {
          parameters: [param('token', 'sekrit'), param('id', '12345')],
          exceptions: [{ class: 'RuntimeError', message: 'boom: sekrit' }],
          sql_query: { sql: "SELECT * FROM users WHERE email = 'a@b.c'", database_type: 'postgres' },
        },
      ],
    };
    sanitizeAppMap(appmap);
    const once = JSON.stringify(appmap);
    sanitizeAppMap(appmap, new ValueMasker());
    expect(JSON.stringify(appmap)).toEqual(once);
  });

  it('parameterizes SQL literals but keeps the statement shape', () => {
    const appmap = {
      events: [
        {
          sql_query: {
            sql: "SELECT * FROM users WHERE email = 'kevin@app.land' AND pin = 1234",
            database_type: 'postgres',
          },
        },
      ],
    };
    sanitizeAppMap(appmap);
    const sql = appmap.events[0].sql_query.sql;
    expect(sql).toContain('SELECT * FROM users WHERE email = ?');
    expect(sql).not.toContain('kevin@app.land');
    expect(sql).not.toContain('1234');
  });

  it('fails closed on SQL it cannot reliably parameterize', () => {
    const appmap = {
      events: [
        {
          sql_query: {
            // Unbalanced quote: the obfuscator returns the original, which
            // must not survive sanitization.
            sql: "SELECT * FROM users WHERE name = 'unterminated",
            database_type: 'postgres',
          },
        },
      ],
    };
    sanitizeAppMap(appmap);
    expect(appmap.events[0].sql_query.sql).toMatch(/^<v\d+>$/);
  });

  it('sanitizes exception messages and message parameters', () => {
    const appmap = {
      events: [
        {
          message: [param('body', '{"password":"hunter2"}')],
          exceptions: [
            { class: 'ConnError', message: 'could not connect to postgres://u:pw@db/nova' },
          ],
        },
      ],
    };
    sanitizeAppMap(appmap);
    expect(appmap.events[0].message[0].value).toMatch(/^<v\d+>$/);
    expect(appmap.events[0].exceptions[0].message).toMatch(/^<v\d+>$/);
    expect(appmap.events[0].exceptions[0].class).toEqual('ConnError'); // schema, kept
  });

  // One test that walks every sanitization branch in a single AppMap. Its
  // recording is the gold trace for the sanitize subsystem: one composite
  // trace instead of one trace per unit test above.
  it('sanitizes a composite AppMap end-to-end', () => {
    const appmap = {
      events: [
        {
          parameters: [param('token', 'sekrit-abc'), param('count', '42')],
          return_value: { class: 'String', value: 'sekrit-abc' },
          exceptions: [{ class: 'ConnError', message: 'postgres://u:pw@db failed' }],
          http_server_request: {
            request_method: 'POST',
            path_info: '/games/123/join',
            normalized_path_info: '/games/:id/join',
            headers: { Authorization: 'sekrit-abc' },
          },
        },
        {
          sql_query: {
            sql: "SELECT * FROM users WHERE email = 'a@b.c'",
            database_type: 'postgres',
          },
        },
        {
          sql_query: {
            sql: "SELECT * FROM users WHERE name = 'unterminated",
            database_type: 'postgres',
          },
        },
      ],
    };
    sanitizeAppMap(appmap);
    const [call, goodSql, badSql] = appmap.events as any[];
    expect(call.parameters[0].value).toEqual('<v1>');
    expect(call.return_value.value).toEqual('<v1>'); // equality preserved
    expect(call.http_server_request.headers.Authorization).toEqual('<v1>'); // shared namespace
    expect(call.parameters[1].value).toMatch(/^<int:v\d+>$/);
    expect(call.exceptions[0].message).toMatch(/^<v\d+>$/);
    expect(call.http_server_request.normalized_path_info).toEqual('/games/:id/join');
    expect(call.http_server_request.path_info).toMatch(/^<v\d+>$/);
    expect(goodSql.sql_query.sql).toEqual('SELECT * FROM users WHERE email = ?');
    expect(badSql.sql_query.sql).toMatch(/^<v\d+>$/); // unparseable: whole statement masked
  });

  it('never touches schema fields', () => {
    const appmap = {
      events: [
        {
          event: 'call',
          defined_class: 'app.Auth',
          method_id: 'verify_token',
          path: 'server/auth.py',
          lineno: 12,
          parameters: [param('token', 'sekrit', 'myapp.Token')],
          labels: ['security.authentication'],
        },
      ],
    };
    sanitizeAppMap(appmap);
    const event = appmap.events[0] as any;
    expect(event.defined_class).toEqual('app.Auth');
    expect(event.method_id).toEqual('verify_token');
    expect(event.path).toEqual('server/auth.py');
    expect(event.labels).toEqual(['security.authentication']);
    expect(event.parameters[0].name).toEqual('token');
    expect(event.parameters[0].class).toEqual('myapp.Token');
  });
});
