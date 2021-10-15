import { AppMap, Event } from '@appland/models';

export type Scope =
  | 'event'
  | 'function'
  | 'http_client_request'
  | 'http_server_request'
  | 'sql_query'
  | 'transaction';

interface ScopedEvent {
  event: Event;
  scopeId: string;
}

export type Level = 'warning' | 'error';

type EventFilter = (e: Event, appMap: AppMap) => boolean;

export interface MatchResult {
  level: Level;
  message?: string;
}

type Matcher = (e: Event, scopeId: string) => boolean | string | MatchResult[] | undefined;

export interface Finding {
  appMapName: string;
  appMapFile?: string;
  scannerId: string;
  scannerTitle: string;
  event: Event;
  message: string | null;
  condition: string;
}

interface Configuration {
  scanners: AssertionConfig[];
}

interface AssertionConfig {
  readonly id: string;
  readonly summaryTitle: string;
  readonly include?: string[];
  readonly exclude?: string[];
  readonly description?: string;
  readonly properties?: Record<string, string | string[] | number>;
}
