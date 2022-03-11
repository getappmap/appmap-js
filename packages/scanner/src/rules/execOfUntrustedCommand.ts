import { Event, EventNavigator } from '@appland/models';
import { MatchResult, Rule, RuleLogic } from '../types';
import parseRuleDescription from './lib/parseRuleDescription';
import precedingEvents from './lib/precedingEvents';
import sanitizesData from './lib/sanitizesData';

function allArgumentsSanitized(rootEvent: Event, event: Event): boolean {
  return (event.parameters || [])
    .filter((parameter) => parameter.object_id)
    .every((parameter): boolean => {
      for (const candidate of precedingEvents(rootEvent, event)) {
        if (sanitizesData(candidate.event, parameter.object_id!, Sanitize)) {
          return true;
        }
      }
      return false;
    });
}

function build(): RuleLogic {
  function matcher(rootEvent: Event): MatchResult[] | undefined {
    for (const event of new EventNavigator(rootEvent).descendants()) {
      if (
        event.event.labels.has(Exec) &&
        !event.event.ancestors().find((ancestor) => ancestor.labels.has(ExecSafe))
      ) {
        if (allArgumentsSanitized(rootEvent, event.event)) {
          return;
        } else {
          return [
            {
              level: 'error',
              event: event.event,
              message: `${event.event} executes an untrusted command string`,
            },
          ];
        }
      }
    }
  }

  return {
    matcher,
  };
}

const Exec = 'system.exec';
const ExecSafe = 'system.exec.safe';
const Sanitize = 'system.exec.sanitize';

export default {
  id: 'exec-of-untrusted-command',
  title: 'Execution of untrusted system command',
  labels: [Exec, ExecSafe, Sanitize],
  impactDomain: 'Security',
  enumerateScope: false,
  // scope: //*[@command]
  references: {},
  description: parseRuleDescription('execOfUntrustedCommand'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#exec-of-untrusted-command',
  build,
} as Rule;
