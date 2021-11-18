import { Event, EventNavigator } from '@appland/models';
import { rpcRequestForEvent } from '../openapi/rpcRequest';
import * as types from './types';
import { AssertionSpec } from '../types';
import Assertion from '../assertion';
import { providesAuthentication } from './util';

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
  private _includeContentTypes: RegExp[] = [];
  private _excludeContentTypes: RegExp[] = [];

  testContentType(contentType: string): boolean {
    return (
      (this._includeContentTypes.length === 0 ||
        this._includeContentTypes.some((pattern) => pattern.test(contentType))) &&
      (this._excludeContentTypes.length === 0 ||
        !this._excludeContentTypes.some((pattern) => pattern.test(contentType)))
    );
  }

  set includeContentTypes(value: string[]) {
    this._includeContentTypes = value.map((pattern) => new RegExp(pattern));
  }

  set excludeContentTypes(value: string[]) {
    this._excludeContentTypes = value.map((pattern) => new RegExp(pattern));
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
          options.testContentType(rpcRequestForEvent(e)!.contentType)
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
