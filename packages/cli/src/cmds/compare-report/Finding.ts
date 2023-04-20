import {Event} from '@appland/models';

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
export default interface Finding {
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
