import { Event } from '@appland/models';
import Assertion from '../assertion';

class Options {
  constructor(public timeAllowed = 1) {}
}

function scanner(options: Options = new Options()): Assertion {
  return Assertion.assert(
    'slow-http-server-request',
    'Slow HTTP server requests',
    'http_server_request',
    (e: Event) => e.elapsedTime! > options.timeAllowed,
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => !!e.httpServerRequest && e.elapsedTime !== undefined;
      assertion.description = `Slow HTTP server request (> ${options.timeAllowed * 1000}ms)`;
    }
  );
}

export default { Options, scanner };
