import { Event, EventNavigator } from '@appland/models';
import { isTruthy, providesAuthentication } from './lib/util';
import { MatcherResult, Rule, RuleLogic, ScopeName } from '../types.d';
import { URL } from 'url';

function containsAuthentication(events: Generator<EventNavigator>) {
  for (const iter of events) {
    if (providesAuthentication(iter.event, SecurityAuthentication)) {
      return true;
    }
  }
  return false;
}

function build(): RuleLogic {
  function matcher(rootEvent: Event): MatcherResult {
    for (const event of new EventNavigator(rootEvent).descendants()) {
      if (providesAuthentication(event.event, SecurityAuthentication)) {
        return;
      }
      if (event.event.labels.has(SecurityAuthorization) && isTruthy(event.event.returnValue)) {
        // If the authorization event has a successful authentication descendant, allow this as well.
        if (containsAuthentication(event.descendants())) {
          return;
        } else {
          return [
            {
              level: 'error',
              event: rootEvent,
              message: `${event.event} provides authorization, but the request is not authenticated`,
              relatedEvents: [event.event],
            },
          ];
        }
      }
    }
  }

  return { matcher };
}

const SecurityAuthentication = 'security.authentication';
const SecurityAuthorization = 'security.authorization';

export default {
  id: 'authz-before-authn',
  title: 'Authorization performed before authentication',
  labels: [SecurityAuthorization, SecurityAuthentication],
  scope: 'http_server_request' as ScopeName,
  impactDomain: 'Security',
  enumerateScope: false,
  references: {
    'CWE-863': new URL('https://cwe.mitre.org/data/definitions/863.html'),
  },
  build,
} as Rule;
