import { Event, EventNavigator } from '@appland/models';
import Assertion from '../assertion';
import { contentType, isFalsey } from './util';

function isPublic(event: Event): boolean {
  return event.labels.has('public');
}

function providesAuthentication(event: Event) {
  return event.labels.has('security.authentication') && !isFalsey(event.returnValue);
}

const authenticatedBy = (iterator: Iterator<EventNavigator>): boolean => {
  let i: IteratorResult<EventNavigator> = iterator.next();
  while (!i.done) {
    if (isPublic(i.value.event) || providesAuthentication(i.value.event)) {
      return true;
    }
    i = iterator.next();
  }

  return false;
};

export default function (routes: RegExp[] = [/.*/], contentTypes: RegExp[] = [/.*/]): Assertion {
  return Assertion.assert(
    'missing-authentication',
    'Unauthenticated HTTP server requests',
    'http_server_request',
    (event: Event) => authenticatedBy(new EventNavigator(event).descendants()),
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => {
        return (
          e.route !== undefined &&
          e.httpServerResponse !== undefined &&
          e.httpServerResponse!.status_code < 300 &&
          contentType(e) !== undefined &&
          routes.some((pattern) => pattern.test(e.route!)) &&
          contentTypes.some((pattern) => pattern.test(contentType(e)!))
        );
      };
      assertion.description = `HTTP server request must be authenticated`;
    }
  );
}
