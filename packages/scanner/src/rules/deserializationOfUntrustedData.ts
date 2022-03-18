import { Event, EventNavigator } from '@appland/models';
import { MatchResult, Rule, RuleLogic } from '../types';
import { URL } from 'url';
import parseRuleDescription from './lib/parseRuleDescription';
import precedingEvents from './lib/precedingEvents';
import sanitizesData from './lib/sanitizesData';

function allArgumentsSanitized(rootEvent: Event, event: Event): boolean {
  return (event.parameters || [])
    .filter((parameter) => parameter.object_id)
    .every((parameter): boolean => {
      for (const candidate of precedingEvents(rootEvent, event)) {
        if (sanitizesData(candidate.event, parameter.object_id!, DeserializeSanitize)) {
          return true;
        }
      }
      return false;
    });
}

function build(): RuleLogic {
  function matcher(rootEvent: Event): MatchResult[] | undefined {
    for (const event of new EventNavigator(rootEvent).descendants()) {
      // events: //*[@authorization && truthy?(returnValue) && not(preceding::*[@authentication]) && not(descendant::*[@authentication])]
      if (
        event.event.labels.has(DeserializeUnsafe) &&
        !event.event.ancestors().find((ancestor) => ancestor.labels.has(DeserializeSafe))
      ) {
        if (allArgumentsSanitized(rootEvent, event.event)) {
          return;
        } else {
          return [
            {
              event: event.event,
              message: `${event.event} deserializes untrusted data`,
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

const DeserializeUnsafe = 'deserialize.unsafe';
const DeserializeSafe = 'deserialize.safe';
const DeserializeSanitize = 'deserialize.sanitize';

export default {
  id: 'deserialization-of-untrusted-data',
  title: 'Deserialization of untrusted data',
  labels: [DeserializeUnsafe, DeserializeSafe, DeserializeSanitize],
  impactDomain: 'Security',
  enumerateScope: false,
  // scope: //*[@command]
  references: {
    'CWE-502': new URL('https://cwe.mitre.org/data/definitions/502.html'),
    'Ruby Security': new URL('https://docs.ruby-lang.org/en/3.0/doc/security_rdoc.html'),
  },
  description: parseRuleDescription('deserializationOfUntrustedData'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#deserialization-of-untrusted-data',
  build,
} as Rule;
