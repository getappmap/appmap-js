import { Event } from '@appland/models';
import { AssertionSpec } from 'src/types';
import Assertion from '../assertion';

function scanner(): Assertion {
  return Assertion.assert(
    'http-5xx',
    'HTTP 5xx status code',
    (e: Event) => e.httpServerResponse!.status >= 500 && e.httpServerResponse!.status < 600,
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => !!e.httpServerResponse;
      assertion.description = `HTTP server request returns 5xx status`;
    }
  );
}

export default { scope: 'http_server_request', enumerateScope: false, scanner } as AssertionSpec;
