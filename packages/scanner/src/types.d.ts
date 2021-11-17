import { AppMap, Event } from '@appland/models';
import Assertion from './assertion';

/**
 * Each Assertion in the scanner library wants to consider some set of events as it decides whether the code should be flagged or not.
 * A Scope is a way of declaring how these "sets" are defined. A common scope is `http_server_request`. The assertion will look at each HTTP
 * server request separately; what happens in one request is irrelevant to the next. For example, when looking for authz_before_authn, each HTTP
 * server request is considered separately.
 *
 * `http_server_request` is one example of a "command". Other types of commands are: CLI commands and background jobs. Each of these has a
 * defined beginning and end, and is logically completely separate from any other command.
 *
 * Some assertions are relevant only to HTTP server requests - such as `http500`. Others are applicable to any kind of command - such as `nPlusOneQuery`.
 *
 * Finally, other assertions simply want to look for a certain condition regardless of where it occurs. For example, Too many SQL joins will flag any
 * query anywhere in the AppMap, even if it's not part of a command. This assertion uses the root scope, which yields a new scope for every root-level Event
 * (root-level = "has no parent").
 *
 * Ideally, AppMaps would not contain any events that are not part of a command - because without knowing the command, we don't really have any context
 * of what the code is trying to do. But, anticipating that this may sometimes happen, "root" scope is a good choice for an assertion that may flag code
 * anywhere in the AppMap.
 */
export type ScopeName = 'root' | 'command' | 'http_client_request' | 'http_server_request';

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

/**
 * EventFilter is used by Assertion to select Events that will be analyzed for findings.
 * The event filter is always applied to the Scope.scope event. If enumerateScope is true,
 * the filter is applied to all Scope.events as well.
 */
type EventFilter = (e: Event, appMap: AppMap) => boolean;

/**
 * MatchResult is created by an Assertion when it matches an Event.
 */
export interface MatchResult {
  level: Level;
  event?: Event;
  message?: string;
  relatedEvents?: Event[];
}

/**
 * Matcher function is part of an Assertion. It's applied to an Event to determine whether there is a finding
 * on this event. If the Matcher returns true, a string, or a MatchResult[], then finding(s) are created.
 */
type Matcher = (
  e: Event,
  appMap: AppMap
) => Promise<boolean | string | MatchResult[]> | boolean | string | MatchResult[] | undefined;

/**
 * Finding is the full data structure that is created when an Assertion matches an Event.
 *
 * The Assertion only needs to return a boolean, string, or MatchResult. The scanner framework
 * adds the rest of the information to build the complete finding.
 */
export interface Finding {
  appMapName: string;
  appMapFile?: string;
  scannerId: string;
  scannerTitle: string;
  event: Event;
  hash: string;
  scope: Event;
  condition: string;
  message?: string;
  relatedEvents?: Event[];
}

/**
 * Configuration is the code representation of the scanner configuration file.
 */
interface Configuration {
  scanners: AssertionConfig[];
}

interface MatchPatternConfig {
  pattern: string;
}

/**
 * AssertionConfig represents the user's configuration of an Assertion, as read from the
 * configuration file.
 */
interface AssertionConfig {
  // id is expected to match the file name of the scanner in src/scanner.
  id: string;
  // User-defined include patterns. If provided, only events for which the filter returns truthy are analyzed.
  include?: MatchPatternConfig[];
  // User-defined exclude expression. If provided, only events for which the filter returns falsey are analyzed.
  exclude?: MatchPatternConfig[];
  description?: string;
  // Properties are mapped to Assertion Options.
  properties?: Record<string, any>;
}

/**
 * AssertionSpec is provided by each Assertion to define itself.
 */
interface AssertionSpec {
  // constructor function used to create an Assertion instance for each matching scope.
  scanner: (options?: any) => Assertion;
  // labels which the assertion depends on.
  labels?: string[];
  // Scope used by the assertion. For each matching Scope in each AppMap, the scanner function is used
  // to create a new Assertion instance. The Scope event is passed to the Assertion Matcher.
  scope?: ScopeName;
  // When enumerateScope is true, all the events in the scope are passed to the Assertion Matcher.
  enumerateScope?: boolean;
  // User-defined options for the assertion.
  Options?: any;
}

/**
 * AssertionPrototype is created by the Scanner framework by combining information in each AssertionConfig
 * with the AssertionSpec provided by the assertion code.
 */
interface AssertionPrototype {
  config: AssertionConfig;
  scope: ScopeName;
  enumerateScope: boolean;
  // build is invoked by the framework to create a new Assertion for each Scope.
  build(): Assertion;
}
