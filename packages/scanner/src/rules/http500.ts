import { Event } from '@appland/models';
import { URL } from 'url';
import { Rule, RuleLogic } from '../types';
import parseRuleDescription from './lib/parseRuleDescription';

function build(): RuleLogic {
  return {
    matcher: (e: Event) => e.httpServerResponse!.status === 500,
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
    'CWE-392': new URL('https://cwe.mitre.org/data/definitions/392.html'),
  },
  description: parseRuleDescription('http500'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#http-500',
  build,
} as Rule;
