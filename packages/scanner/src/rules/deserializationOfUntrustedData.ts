import { Event, EventNavigator } from '@appland/models';
import { MatchResult, Rule, RuleLogic } from '../types';
import { URL } from 'url';

function sanitizesData(event: Event, objectId: number, label: string): boolean {
  return (
    event.labels.has(label) &&
    !!event.returnValue &&
    !!event.returnValue.object_id &&
    event.returnValue.object_id === objectId
  );
}

function* precedingEvents(rootEvent: Event, target: Event) {
  for (const event of new EventNavigator(rootEvent).descendants()) {
    if (event.event === target) {
      break;
    }
    yield event;
  }
}

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
      if (event.event.labels.has(DeserializeUnsafe)) {
        if (allArgumentsSanitized(rootEvent, event.event)) {
          return;
        } else {
          return [
            {
              level: 'error',
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
const Sanitize = 'sanitize';

export default {
  id: 'deserialization-of-untrusted-data',
  title: 'Deserialization of untrusted data',
  labels: [DeserializeUnsafe, Sanitize],
  impactDomain: 'Security',
  enumerateScope: false,
  references: {
    'CWE-502': new URL('https://cwe.mitre.org/data/definitions/502.html'),
    'Ruby Security': new URL('https://docs.ruby-lang.org/en/3.0/doc/security_rdoc.html'),
  },
  build,
} as Rule;
