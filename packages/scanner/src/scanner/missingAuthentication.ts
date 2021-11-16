import { Event, EventNavigator } from '@appland/models';
import { rpcRequestForEvent } from '../openapi/rpcRequest';
import * as types from './types';
import { AssertionSpec } from '../types';
import Assertion from '../assertion';
import { providesAuthentication, toRegExpArray } from './util';

function isPublic(event: Event): boolean {
  return event.labels.has(Public);
}

const authenticatedBy = (iterator: Iterator<EventNavigator>): boolean => {
  let i: IteratorResult<EventNavigator> = iterator.next();
  while (!i.done) {
    if (isPublic(i.value.event) || providesAuthentication(i.value.event, SecurityAuthentication)) {
      return true;
    }
    i = iterator.next();
  }

  return false;
};

class Options implements types.MissingAuthentication.Options {
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
          !!rpcRequestForEvent(e) &&
          !!rpcRequestForEvent(e)!.contentType &&
          options.routes.some((pattern) => pattern.test(e.route!)) &&
          options.contentTypes.some((pattern) => pattern.test(rpcRequestForEvent(e)!.contentType))
        );
      };
      assertion.description = `HTTP server request must be authenticated`;
    }
  );
}

const Public = 'public';
const SecurityAuthentication = 'security.authentication';

export default {
  scope: 'http_server_request',
  Labels: [Public, SecurityAuthentication],
  enumerateScope: false,
  Options,
  scanner,
} as AssertionSpec;
