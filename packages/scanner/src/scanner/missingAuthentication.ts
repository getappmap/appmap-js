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

class Options {
  constructor(public routes: RegExp[] = [/.*/], public contentTypes: RegExp[] = [/.*/]) {}
}

function scanner(options: Options = new Options()): Assertion {
  return Assertion.assert(
    'missing-authentication',
    'Unauthenticated HTTP server requests',
    'http_server_request',
    (event: Event) => !authenticatedBy(new EventNavigator(event).descendants()),
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => {
        return (
          e.route !== undefined &&
          e.httpServerResponse !== undefined &&
          e.httpServerResponse.status < 300 &&
          contentType(e) !== undefined &&
          options.routes.some((pattern) => pattern.test(e.route!)) &&
          options.contentTypes.some((pattern) => pattern.test(contentType(e)!))
        );
      };
      assertion.description = `HTTP server request must be authenticated`;
    }
  );
}

export default { Options, scanner };
