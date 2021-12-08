import { Event, EventNavigator } from '@appland/models';
import { rpcRequestForEvent } from '../openapi/rpcRequest';
import * as types from './types';
import { Rule, RuleLogic, StringFilter } from '../types';
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

function build(options: Options = new Options()): RuleLogic {
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

  function matcher(event: Event): boolean {
    return !authenticatedBy(new EventNavigator(event).descendants());
  }

  function where(e: Event) {
    return (
      e.route !== undefined &&
      e.httpServerResponse !== undefined &&
      e.httpServerResponse.status < 300 &&
      !!rpcRequestForEvent(e) &&
      !!rpcRequestForEvent(e)!.contentType &&
      testContentType(rpcRequestForEvent(e)!.contentType)
    );
  }
  return {
    where,
    matcher,
  };
}
const Public = 'public';
const SecurityAuthentication = 'security.authentication';

export default {
  id: 'missing-authentication',
  title: 'Unauthenticated HTTP server request',
  scope: 'http_server_request',
  labels: [Public, SecurityAuthentication],
  enumerateScope: false,
  Options,
  build,
} as Rule;
