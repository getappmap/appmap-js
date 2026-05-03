import { applyFilter } from '../../../../../src/cmds/query/verbs/tree';
import {
  ExceptionNode,
  FunctionNode,
  HttpClientNode,
  HttpServerNode,
  LogNode,
  SqlNode,
  TreeNode,
} from '../../../../../src/cmds/query/queries/tree';

const baseFields = {
  parent_event_id: null,
  thread_id: null,
  depth: 0,
};

const http: HttpServerNode = {
  kind: 'http_server', event_id: 1, ...baseFields,
  method: 'GET', route: '/x', status_code: 200, elapsed_ms: 1,
};
const httpOut: HttpClientNode = {
  kind: 'http_client', event_id: 2, ...baseFields,
  method: 'GET', url: 'https://x', status_code: 200, elapsed_ms: 1,
};
const sql: SqlNode = {
  kind: 'sql', event_id: 3, ...baseFields,
  sql_text: 'SELECT 1', database_type: null, elapsed_ms: 1,
};
const fn: FunctionNode = {
  kind: 'function', event_id: 4, ...baseFields,
  fqid: 'app/X#m', defined_class: 'X', method_id: 'm',
  path: null, lineno: null, is_static: false,
  elapsed_ms: 1, parameters_json: null, return_value: null,
};
const exc: ExceptionNode = {
  kind: 'exception', event_id: 5, ...baseFields,
  exception_class: 'IOError', message: null, path: null, lineno: null,
};
const lg: LogNode = {
  kind: 'log', event_id: 6, ...baseFields,
  fqid: 'app/Logger#info', logger: 'Logger', method_id: 'info',
  path: null, lineno: null, elapsed_ms: 0.1,
  parameters_json: '[{"name":"message","value":"hi"}]', return_value: null,
};

const all: TreeNode[] = [http, httpOut, sql, fn, exc, lg];

describe('tree --filter', () => {
  it('all returns every node', () => {
    expect(applyFilter(all, 'all')).toHaveLength(6);
  });
  it('http includes server and client requests', () => {
    expect(applyFilter(all, 'http')).toEqual([http, httpOut]);
  });
  it('sql returns only sql nodes', () => {
    expect(applyFilter(all, 'sql')).toEqual([sql]);
  });
  it('logs returns only log nodes', () => {
    expect(applyFilter(all, 'logs')).toEqual([lg]);
  });
});
