import { Event } from '@appland/models';
import { URL } from 'url';
import { Rule, RuleLogic } from '../types';

function build(): RuleLogic {
  return {
    matcher: (e: Event) =>
      e.httpServerResponse!.status >= 500 && e.httpServerResponse!.status < 600,
    where: (e: Event) => !!e.httpServerResponse,
  };
}

export default {
  id: 'http-500',
  title: 'HTTP 500 status code',
  scope: 'http_server_request',
  enumerateScope: false,
  impactDomain: 'Stability',
  references: {
    'CWE-394': new URL('https://cwe.mitre.org/data/definitions/394.html'),
  },
  build,
} as Rule;
