import { Event, EventNavigator } from '@appland/models';
import { AssertionSpec } from 'src/types';
import Assertion from '../assertion';
import { contentType, isFalsey, toRegExpArray } from './util';

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
  private _routes: RegExp[];
  private _contentTypes: RegExp[];

  constructor(routes: RegExp[] = [/.*/], contentTypes: RegExp[] = [/.*/]) {
    this._routes = routes;
    this._contentTypes = contentTypes;
  }

  get routes(): RegExp[] {
    return this._routes;
  }

  set routes(value: RegExp[] | string[]) {
    this._routes = toRegExpArray(value);
  }

  get contentTypes(): RegExp[] {
    return this._contentTypes;
  }

  set contentTypes(value: RegExp[] | string[]) {
    this._contentTypes = toRegExpArray(value);
  }
}

function scanner(options: Options = new Options()): Assertion {
  return Assertion.assert(
    'missing-authentication',
    'Unauthenticated HTTP server requests',
    (event: Event) => !authenticatedBy(new EventNavigator(event).descendants()),
    (assertion: Assertion): void => {
      assertion.options = options;
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

export default {
  scope: 'http_server_request',
  enumerateScope: false,
  Options,
  scanner,
} as AssertionSpec;
