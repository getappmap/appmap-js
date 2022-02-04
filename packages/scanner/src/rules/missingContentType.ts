import { Event } from '@appland/models';
import { Rule, RuleLogic } from 'src/types';
import { rpcRequestForEvent } from '../openapi/rpcRequest';
import parseRuleDescription from './lib/parseRuleDescription';

const isRedirect = (status: number) => [301, 302, 303, 307, 308].includes(status);
const hasContent = (status: number) => status !== 204;

function build(): RuleLogic {
  function matcher(e: Event) {
    return rpcRequestForEvent(e)!.contentType === undefined;
  }
  function where(e: Event) {
    return (
      !!e.httpServerResponse &&
      !isRedirect(e.httpServerResponse!.status) &&
      hasContent(e.httpServerResponse!.status)
    );
  }
  return {
    matcher,
    where,
  };
}

export default {
  id: 'missing-content-type',
  title: 'HTTP server request without a Content-Type header',
  scope: 'http_server_request',
  impactDomain: 'Stability',
  enumerateScope: false,
  description: parseRuleDescription('missingContentType'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#missing-content-type',
  build,
} as Rule;
