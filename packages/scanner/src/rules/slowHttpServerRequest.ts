import { Rule, RuleLogic } from 'src/types';
import * as types from './types';

class Options implements types.SlowHTTPServerRequest.Options {
  public timeAllowed = 1;
}

function build(options: Options): RuleLogic {
  return {
    matcher: (e) => e.elapsedTime! > options.timeAllowed,
    message: () => `Slow HTTP server request (> ${options.timeAllowed * 1000}ms)`,
    where: (e) => !!e.httpServerRequest && e.elapsedTime !== undefined,
  };
}

export default {
  id: 'slow-http-server-request',
  title: 'Slow HTTP server request',
  scope: 'http_server_request',
  enumerateScope: false,
  Options,
  build,
} as Rule;
