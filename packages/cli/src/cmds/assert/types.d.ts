export type Scope = 'appmap' | 'http_server_request' | 'sql_query' | 'function';

export interface AssertionFailure {
  appMapName: string;
  event: any;
  condition: string;
}
