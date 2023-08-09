import { AppMap, Event } from '@appland/models';
import { SqliteParser } from '@appland/models/types/sqlite-parser';

/**
 * Scope provides an Event at the root of the scope, and a Generator to iterate over its descendants.
 */
interface Scope {
  scope: Event;
  events: () => Generator<Event>;
}

/**
 * Level indicates the priority of a finding.
 */
export type Level = 'warning' | 'error';

type StringFilter = (value: string) => boolean;

/**
 * EventFilter is used by Rule to select Events that will be analyzed for findings.
 * The event filter is always applied to the Scope.scope event. If enumerateScope is true,
 * the filter is applied to all Scope.events as well.
 */
type EventFilter = (e: Event, appMapIndex: AppMapIndex) => boolean;

/**
 * MatchResult is created by a rule when it matches an Event.
 */
export interface MatchResult {
  level?: Level;
  event: Event;
  message: string;
  participatingEvents?: Record<string, Event>;
  groupMessage?: string;
  occurranceCount?: number;
  relatedEvents?: Event[];
}

type MatcherResult =
  | Promise<boolean | string | MatchResult[]>
  | boolean
  | string
  | MatchResult[]
  | undefined;

type EventType = 'http_server_request' | 'http_client_request' | 'sql_query' | 'function';

export type QueryAST = SqliteParser.ListStatement | null;

interface AppMapIndex {
  appMap: AppMap;

  sqlAST(event: Event): QueryAST | undefined;

  sqlNormalized(event: Event): string;
}

/**
 * Matcher function is part of a rule. It's applied to an Event to determine whether there is a finding
 * on this event. If the Matcher returns true, a string, or a MatchResult[], then finding(s) are created.
 */
type Matcher = (e: Event, appMapIndex: AppMapIndex, eventFilter: EventFilter) => MatcherResult;

export interface RuleLogic {
  // Tests an event in the scope see if it matches the rule conditions.
  matcher: Matcher;
  // When specified by the rule, only events which pass the where filter
  // will be passed to the matcher.
  where?: EventFilter;
  // When specified by the rule, provides a detailed message for a finding on a specific event.
  message?: (scope: Event, event: Event) => string;
}
