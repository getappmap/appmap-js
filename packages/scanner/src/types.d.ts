import { AppMap, Event } from '@appland/models';
import { SqliteParser } from '@appland/models/types/sqlite-parser';
import { URL } from 'url';

/**
 * Each Rule in the scanner library wants to consider some set of events as it decides whether the code should be flagged or not.
 * A Scope is a way of declaring how these "sets" are defined. A common scope is `http_server_request`. The rule will look at each HTTP
 * server request separately; what happens in one request is irrelevant to the next. For example, when looking for authz_before_authn, each HTTP
 * server request is considered separately.
 *
 * `http_server_request` is one example of a "command". Other types of commands are: CLI commands and background jobs. Each of these has a
 * defined beginning and end, and is logically completely separate from any other command.
 *
 * Some rules are relevant only to HTTP server requests - such as `http500`. Others are applicable to any kind of command - such as `nPlusOneQuery`.
 *
 * Finally, other rules simply want to look for a certain condition regardless of where it occurs. For example, Too many SQL joins will flag any
 * query anywhere in the AppMap, even if it's not part of a command. This rule uses the root scope, which yields a new scope for every root-level Event
 * (root-level = "has no parent").
 *
 * Ideally, AppMaps would not contain any events that are not part of a command - because without knowing the command, we don't really have any context
 * of what the code is trying to do. But, anticipating that this may sometimes happen, "root" scope is a good choice for a rule that may flag code
 * anywhere in the AppMap.
 */
export type ScopeName = 'root' | 'command' | 'http_client_request' | 'http_server_request';

/**
 * Indicates the aspect of software quality that is most relevant to a rule.
 */
export type ImpactDomain = 'Security' | 'Performance' | 'Maintainability' | 'Stability';

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
  level: Level;
  event?: Event;
  message?: string;
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

  sqlAST(event: Event): QueryAST;

  sqlNormalized(event: Event): string;

  forType(type: EventType, rootEvent?: Event | undefined): Event[];

  forLabel(label: string, rootEvent?: Event | undefined): Event[];
}

/**
 * Matcher function is part of a rule. It's applied to an Event to determine whether there is a finding
 * on this event. If the Matcher returns true, a string, or a MatchResult[], then finding(s) are created.
 */
type Matcher = (e: Event, appMapIndex: AppMapIndex, eventFilter: EventFilter) => MatcherResult;

/**
 * Finding is the full data structure that is created when a Rule matches an Event.
 *
 * The Rule only needs to return a boolean, string, or MatchResult. The scanner framework
 * adds the rest of the information to build the complete finding.
 */
interface Finding {
  appMapFile: string;
  checkId: string;
  ruleId: string;
  ruleTitle: string;
  event: Event;
  hash: string;
  scope: Event;
  message: string;
  stack: string[];
  groupMessage?: string;
  occurranceCount?: number;
  relatedEvents?: Event[];
}

interface RuleLogic {
  // Tests an event in the scope see if it matches the rule conditions.
  matcher: Matcher;
  // When specified by the rule, only events which pass the where filter
  // will be passed to the matcher.
  where?: EventFilter;
  // When specified by the rule, provides a detailed message for a finding on a specific event.
  message?: (scope: Event, event: Event) => string;
}

interface Rule {
  // Unique id of the rule.
  id: string;
  // Simple text description of the rule.
  title: string;
  // Longer text description of the rule.
  description: string;
  // URL to the documentation.
  url?: string;
  // labels which the rule depends on.
  labels?: string[];
  // Specifies which sub-tree events will be identified as "root events of concern".
  // Events which are outside of any scope will not be processed by the rule.
  scope?: ScopeName;
  // Whether to pass all the events in the scope to the matcher. If false, only the scope event
  // is passed to the matcher, and the rule should traverse the scope as needed.
  enumerateScope: boolean;
  impactDomain?: ImpactDomain;
  references?: Record<string, URL>;
  // User-defined options for the rule.
  Options?: any;
  // Function to instantiate the rule logic from configured options.
  build: (options: any) => RuleLogic;
}
