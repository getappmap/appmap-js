import { Event, EventNavigator } from '@appland/models';
import { rpcRequestForEvent } from '../openapi/rpcRequest';
import * as types from './types';
import { MatchResult, Rule, RuleLogic, StringFilter } from '../types';
import { providesAuthentication } from './lib/util';
import MatchPatternConfig from 'src/configuration/types/matchPatternConfig';
import { buildFilters } from './lib/matchPattern';
import { URL } from 'url';
import parseRuleDescription from './lib/parseRuleDescription';

function isPublic(event: Event): boolean {
  return event.labels.has(AccessPublic);
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

  function matcher(event: Event): MatchResult[] | undefined {
    if (!authenticatedBy(new EventNavigator(event).descendants())) {
      return [
        {
          event: event,
          message: `Unauthenticated HTTP server request: ${event.route}`,
        },
      ];
    }
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
const AccessPublic = 'access.public';
const SecurityAuthentication = 'security.authentication';

export default {
  id: 'missing-authentication',
  title: 'Unauthenticated HTTP server request',
  scope: 'http_server_request',
  labels: [AccessPublic, SecurityAuthentication],
  impactDomain: 'Security',
  enumerateScope: false,
  references: {
    'CWE-306': new URL('https://cwe.mitre.org/data/definitions/306.html'),
  },
  description: parseRuleDescription('missingAuthentication'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#missing-authentication',
  Options,
  build,
} as Rule;
