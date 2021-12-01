import { Event, EventNavigator } from '@appland/models';
import { AssertionSpec, MatchResult } from '../types.d';
import Assertion from '../assertion';
import { isTruthy, providesAuthentication } from './util';

function containsAuthentication(events: Generator<EventNavigator>) {
  for (const iter of events) {
    if (providesAuthentication(iter.event, SecurityAuthentication)) {
      return true;
    }
  }
  return false;
}

function scanner(): Assertion {
  return Assertion.assert(
    'authz-before-authn',
    'Authorization before authentication',
    (rootEvent: Event): MatchResult[] | undefined => {
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
    },
    (assertion: Assertion): void => {
      assertion.where = (e) => Boolean(e.httpServerRequest);
      assertion.description = 'Authorization performed before authentication';
    }
  );
}

const SecurityAuthentication = 'security.authentication';
const SecurityAuthorization = 'security.authorization';

export default {
  labels: [SecurityAuthorization, SecurityAuthentication],
  scope: 'http_server_request',
  enumerateScope: false,
  scanner,
} as AssertionSpec;
