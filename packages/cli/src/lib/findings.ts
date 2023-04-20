// TODO: These types are copied from @appland/scanner. @appland/scanner should become a dependency of @appland/appmap,
// and the CLI commands should be removed from @appland/scanner.
// The fact that the two projects both have a CLI is just a historical artifact, that can now be resoved.

import { Event } from '@appland/models';

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
