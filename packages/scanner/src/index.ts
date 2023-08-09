import { Event, Metadata } from '@appland/models';

import Configuration from './configuration/types/configuration';

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
export type ScopeName =
  | 'root'
  | 'command'
  | 'http_client_request'
  | 'http_server_request'
  | 'transaction';

/**
 * Indicates the aspect of software quality that is most relevant to a rule.
 */
export type ImpactDomain = 'Security' | 'Performance' | 'Maintainability' | 'Stability';

/**
 * Finding is the full data structure that is created when a Rule matches an Event.
 *
 * The Rule only needs to return a boolean, string, or MatchResult. The scanner framework
 * adds the rest of the information to build the complete finding.
 */
export interface Finding {
  appMapFile: string;
  checkId: string;
  ruleId: string;
  ruleTitle: string;
  event: Event;
  hash: string; // Deprecated for local use. Still used to integrate local results with the server.
  hash_v2: string;
  scope: Event;
  message: string;
  stack: string[];
  groupMessage?: string;
  occurranceCount?: number;
  relatedEvents?: Event[];
  impactDomain?: ImpactDomain;
  // Map of events by functional role name; for example, logEvent, secret, scope, etc.
  participatingEvents?: Record<string, Event>;
  scopeModifiedDate?: Date;
  eventsModifiedDate?: Date;
}

export interface Rule {
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
}

export interface Check {
  id: string;
  scope: ScopeName;
  impactDomain: ImpactDomain;
  rule: Rule;
}

export interface ScanResults {
  configuration: Configuration;
  appMapMetadata: Record<string, Metadata>;
  findings: Finding[];
  checks: Check[];
}

export { default as scan } from './scan';
