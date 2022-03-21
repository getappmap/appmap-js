import { Event, EventNavigator } from '@appland/models';
import { MatchResult, Rule, RuleLogic } from 'src/types';
import { URL } from 'url';
import parseRuleDescription from './lib/parseRuleDescription';

function containsSessionClear(events: Generator<EventNavigator>) {
  for (const iter of events) {
    if (iter.event.labels.has(HTTPSessionClear)) {
      return true;
    }
  }
  return false;
}

function build(): RuleLogic {
  function matcher(rootEvent: Event): MatchResult[] | undefined {
    for (const event of new EventNavigator(rootEvent).descendants()) {
      // .//*[@security.logout]
      if (event.event.labels.has(SecurityLogout)) {
        // .//*[@http.session.clear]
        if (containsSessionClear(event.descendants())) {
          return;
        } else {
          return [
            {
              event: event.event,
              message: `${event.event} logs out the user, but the HTTP session is not cleared`,
            },
          ];
        }
      }
    }
  }

  return {
    matcher,
  };
}

const SecurityLogout = 'security.logout';
const HTTPSessionClear = 'http.session.clear';

export default {
  id: 'logout-without-session-reset',
  title: 'Logout without session reset',
  scope: 'http_server_request',
  labels: [HTTPSessionClear, SecurityLogout],
  impactDomain: 'Security',
  enumerateScope: false,
  references: {
    'CWE-488': new URL('https://cwe.mitre.org/data/definitions/488.html'),
    'OWASP - Session fixation': new URL('https://owasp.org/www-community/attacks/Session_fixation'),
    'Ruby on Rails - Session fixation countermeasures': new URL(
      'https://guides.rubyonrails.org/security.html#session-fixation-countermeasures'
    ),
  },
  description: parseRuleDescription('logoutWithoutSessionReset'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#logout-without-session-reset',
  build,
} as Rule;
