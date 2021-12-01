import { Event, EventNavigator } from '@appland/models';
import { rpcRequestForEvent } from '../openapi/rpcRequest';
import * as types from './types';
import { AssertionSpec, StringFilter } from '../types';
import Assertion from '../assertion';
import { providesAuthentication } from './util';
import MatchPatternConfig from 'src/configuration/types/matchPatternConfig';
import { buildFilters } from './lib/matchPattern';

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
  public includeContentTypes: MatchPatternConfig[] = [];
  public excludeContentTypes: MatchPatternConfig[] = [];
}

function scanner(options: Options = new Options()): Assertion {
  const includeContentTypes = buildFilters(options.includeContentTypes);
  const excludeContentTypes = buildFilters(options.excludeContentTypes);

  function testContentType(contentType: string): boolean {
    function test(filter: StringFilter): boolean {
      return filter(contentType);
    }

    return (
      (includeContentTypes.length === 0 || includeContentTypes.some(test)) &&
      !excludeContentTypes.some(test)
    );
  }

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
          testContentType(rpcRequestForEvent(e)!.contentType)
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
  labels: [Public, SecurityAuthentication],
  enumerateScope: false,
  Options,
  scanner,
} as AssertionSpec;
