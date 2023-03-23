// TODO: These types are copied from @appland/scanner. @appland/scanner should become a dependency of @appland/appmap,
// and the CLI commands should be removed from @appland/scanner.
// The fact that the two projects both have a CLI is just a historical artifact, that can now be resoved.

import { Event } from '@appland/models';

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
}

export type PropertyName = 'id' | 'type' | 'fqid' | 'query' | 'route';

export interface MatchPatternConfig {
  ignoreCase: boolean;
  match?: RegExp;
  include?: string;
  equal?: string;
}

export interface MatchEventConfig {
  property: PropertyName;
  test: MatchPatternConfig;
}

export interface MatchConfig {
  scope?: MatchEventConfig;
  event?: MatchEventConfig;
}

/**
 * CheckConfig represents the user's configuration of an Check, which is an
 * instantiation of a Rule. Each CheckConfing is read from the scanners configuration file.
 */
export interface CheckConfig {
  // rule is expected to match the file name of the rule in src/rules.
  rule: string;
  // default: id
  id?: string;
  scope?: string;
  include?: MatchConfig[];
  exclude?: MatchConfig[];
  // Properties are mapped to rule Options.
  properties?: Record<string, unknown>;
}

export default interface Configuration {
  checks: CheckConfig[];
}
