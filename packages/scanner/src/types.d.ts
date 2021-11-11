import { AppMap, Event } from '@appland/models';
import Assertion from './assertion';

export type ScopeName = 'root' | 'command' | 'http_client_request' | 'http_server_request';

interface Scope {
  scope: Event;
  events: () => Generator<Event>;
}

export type Level = 'warning' | 'error';

type EventFilter = (e: Event, appMap: AppMap) => boolean;

export interface FindingSummary {
  scannerTitle: string;
  findingTotal: number;
  messages: Set<string>;
}

export interface ScannerSummary {
  checkTotal: number;
  findingTotal: number;
  // Record key is the finding id.
  findingSummary: Record<string, FindingSummary>;
}

export interface MatchResult {
  level: Level;
  event?: Event;
  message?: string;
  relatedEvents?: Event[];
}

type Matcher = (
  e: Event,
  appMap: AppMap
) => Promise<boolean | string | MatchResult[]> | boolean | string | MatchResult[] | undefined;

export interface Finding {
  appMapName: string;
  appMapFile?: string;
  scannerId: string;
  scannerTitle: string;
  event: Event;
  scope: Event;
  condition: string;
  message?: string;
  relatedEvents?: Event[];
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
  enumerateScope: boolean;
  build(): Assertion;
}

interface AssertionSpec {
  scanner: (options?: any) => Assertion;
  scope?: ScopeName;
  enumerateScope?: boolean;
  Options?: any;
}
