import { AppMap, Event } from '@appland/models';
import Assertion from './assertion';

export type ScopeName = 'all' | 'root' | 'command' | 'http_server_request';

interface Scope {
  scope: Event;
  events: () => Generator<Event>;
}

export type Level = 'warning' | 'error';

type EventFilter = (e: Event, appMap: AppMap) => boolean;

export interface MatchResult {
  level: Level;
  message?: string;
}

type Matcher = (e: Event) => boolean | string | MatchResult[] | undefined;

export interface Finding {
  appMapName: string;
  appMapFile?: string;
  scannerId: string;
  scannerTitle: string;
  event: Event;
  scope: Event;
  message: string | null;
  condition: string;
}

interface Configuration {
  scanners: AssertionConfig[];
}

interface AssertionConfig {
  readonly id: string;
  readonly include?: string[];
  readonly exclude?: string[];
  readonly description?: string;
  readonly properties?: Record<string, string | string[] | number>;
}

interface AssertionPrototype {
  config: AssertionConfig;
  scope: ScopeName;
  build(): Assertion;
}
