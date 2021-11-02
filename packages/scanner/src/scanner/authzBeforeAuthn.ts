import { Event } from '@appland/models';
import Assertion from '../assertion';
import { isTruthy } from './util';

function scanner(): Assertion {
  return Assertion.assert(
    'authz-before-authn',
    'Authorization before authentication',
    (rootEvent: Event) => {
      const events: Event[] = [...rootEvent.children];

      while (events.length > 0) {
        const event = events.shift()!;

        // If the first event is a successful authentication call (i.e. has a truthy return value)
        // then we can stop here. We already know that authentication came first.
        if (event.labels.has('security.authentication') && isTruthy(event.returnValue?.value)) {
          return false;
        }

        if (event.labels.has('security.authorization')) {
          // Consider cases where an authorization call leads to an authentication call as valid.
          const childDoesAuthn = event
            .ancestors()
            .some((a) => a.labels.has('security.authentication'));

          return childDoesAuthn ? false : [{ level: 'error', event }];
        }
        events.push(...event.children);
      }

      return false;
    },
    (assertion: Assertion): void => {
      assertion.where = (e) => Boolean(e.httpServerRequest);
      assertion.description = 'Authorization performed before authentication';
    }
  );
}

export default { scope: 'http_server_request', enumerateScope: false, scanner };
