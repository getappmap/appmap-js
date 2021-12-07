import { Event } from '@appland/models';
import { Rule, RuleLogic } from '../types';

function build(): RuleLogic {
  return {
    matcher: (e: Event) =>
      e.httpServerResponse!.status >= 500 && e.httpServerResponse!.status < 600,
    where: (e: Event) => !!e.httpServerResponse,
  };
}

export default {
  id: 'http-5xx',
  title: 'HTTP 5xx status code',
  scope: 'http_server_request',
  enumerateScope: false,
  build,
} as Rule;
