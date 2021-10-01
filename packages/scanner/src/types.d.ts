import { AppMap, Event } from '@appland/models';

export type Scope =
  | 'event'
  | 'http_client_request'
  | 'http_server_request'
  | 'sql_query'
  | 'function';

export type Level = 'warning' | 'error';

type EventFilter = (e: Event, appMap: AppMap) => boolean;

export interface MatchResult {
  level: Level;
  message?: string;
}

type Matcher = (e: Event, appMap: AppMap) => boolean | string | MatchResult[] | undefined;

export interface Finding {
  appMapName: string;
  appMapFile?: string;
  scannerId: string;
  scannerTitle: string;
  event: Event;
  message: string | null;
  condition: string;
}
