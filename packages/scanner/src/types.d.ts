import { Event } from '@appland/models';

export type Scope = 'appmap' | 'http_server_request' | 'sql_query' | 'function';

export interface AssertionFailure {
  appMapName: string;
  event: Event;
  condition: string;
}
