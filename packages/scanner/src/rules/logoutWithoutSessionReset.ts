import { Event, EventNavigator } from '@appland/models';
import { MatchResult, Rule, RuleLogic } from 'src/types';
import { URL } from 'url';

function clearsSession(event: Event, label: string): boolean {
  return event.labels.has(label);
}

function containsSessionClear(events: Generator<EventNavigator>) {
  for (const iter of events) {
    if (clearsSession(iter.event, HTTPSessionClear)) {
      return true;
    }
  }
  return false;
}

function build(): RuleLogic {
  function matcher(rootEvent: Event): MatchResult[] | undefined {
    for (const event of new EventNavigator(rootEvent).descendants()) {
      if (event.event.labels.has(SecurityLogout)) {
        if (containsSessionClear(event.descendants())) {
          return;
        } else {
          return [
            {
              level: 'error',
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
  build,
} as Rule;
