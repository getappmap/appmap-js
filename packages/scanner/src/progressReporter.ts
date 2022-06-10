import { AppMap, Event } from '@appland/models';
import Check from './check';
import { AppMapIndex, MatchResult, ScopeName } from './types';

export default interface ProgressReporter {
  beginAppMap(appMapFileName: string, appMap: AppMap): Promise<void>;
  beginCheck(check: Check): Promise<void>;
  filterScope(scopeName: ScopeName, scope: Event): Promise<void>;
  enterScope(scope: Event): Promise<void>;
  filterEvent(event: Event): Promise<void>;
  matchResult(matchResult: string | boolean | MatchResult[] | undefined): Promise<void>;
  matchEvent(event: Event, appMapIndex: AppMapIndex): Promise<void>;
  leaveScope(): Promise<void>;
  endCheck(): Promise<void>;
  endAppMap(): Promise<void>;
}
