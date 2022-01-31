import { Event } from '@appland/models';
import { isTruthy } from './lib/util';
import { AppMapIndex, MatcherResult, Rule, RuleLogic } from '../types.d';
import { URL } from 'url';
import parseRuleDescription from './lib/parseRuleDescription';

function build(): RuleLogic {
  function matcher(rootEvent: Event, appMapIndex: AppMapIndex): MatcherResult {
    const authorizers = appMapIndex
      .forLabel(SecurityAuthorization, rootEvent)
      .filter((event) => isTruthy(event.returnValue));

    if (authorizers.length === 0) return;

    const authenticators = appMapIndex.forLabel(SecurityAuthentication, rootEvent);

    if (authenticators.length > 0 && authenticators[0].id < authorizers[0].id) return;

    return authorizers
      .filter((event) => appMapIndex.forLabel(SecurityAuthentication, event).length === 0)
      .map((event) => {
        return {
          level: 'error',
          event: event,
          message: `${event} provides authorization, but the request is not authenticated`,
        };
      });
  }

  return { matcher };
}

const SecurityAuthentication = 'security.authentication';
const SecurityAuthorization = 'security.authorization';

export default {
  id: 'authz-before-authn',
  title: 'Authorization performed before authentication',
  labels: [SecurityAuthorization, SecurityAuthentication],
  // //http_server_request
  scope: 'http_server_request',
  impactDomain: 'Security',
  enumerateScope: false,
  references: {
    'CWE-863': new URL('https://cwe.mitre.org/data/definitions/863.html'),
  },
  description: parseRuleDescription('authzBeforeAuthn'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#authz-before-authn',
  build,
} as Rule;
