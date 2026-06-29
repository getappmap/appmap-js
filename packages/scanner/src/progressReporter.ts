import type { AppMap, Event } from '@appland/models';
import type Check from './check';
import type { AppMapIndex, MatchResult } from './types';
import type { ScopeName } from './index';

export default interface ProgressReporter {
  beginAppMap(appMapFileName: string, appMap: AppMap): Promise<void>;
  beginCheck(check: Check): Promise<void>;
  filterScope(scopeName: ScopeName, scope: Event): Promise<void>;
  enterScope(scope: Event): Promise<void>;
  filterEvent(event: Event): Promise<void>;
  matchResult(
    event: Event,
    matchResult: string | boolean | MatchResult[] | undefined
  ): Promise<void>;
  matchEvent(event: Event, appMapIndex: AppMapIndex): Promise<void>;
  leaveScope(): Promise<void>;
  endCheck(): Promise<void>;
  endAppMap(): Promise<void>;
}
