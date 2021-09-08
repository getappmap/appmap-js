import { AppMap, Event } from '@appland/models';

export type Scope =
  | 'event'
  | 'http_client_request'
  | 'http_server_request'
  | 'sql_query'
  | 'function';

type EventFilter = (e: Event, appMap: AppMap) => boolean;

export interface AssertionFailure {
  appMapName: string;
  event: Event;
  condition: string;
}
