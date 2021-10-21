import { Event } from '@appland/models';
import { rpcRequestForEvent } from '../openapi/rpcRequest';
import { AssertionSpec } from '../types';
import Assertion from '../assertion';

const isRedirect = (status: number) => [301, 302, 303, 307, 308].includes(status);
const hasContent = (status: number) => status !== 204;

const scanner = (): Assertion => {
  return Assertion.assert(
    'missing-content-type',
    'HTTP server requests without a Content-Type header',
    (e: Event) => rpcRequestForEvent(e)!.contentType === undefined,
    (assertion: Assertion): void => {
      assertion.where = (e: Event) =>
        !!e.httpServerResponse &&
        !isRedirect(e.httpServerResponse!.status) &&
        hasContent(e.httpServerResponse!.status);
      assertion.description = `HTTP server request must have a Content-Type header`;
    }
  );
};

export default { scope: 'http_server_request', enumerateScope: false, scanner } as AssertionSpec;
