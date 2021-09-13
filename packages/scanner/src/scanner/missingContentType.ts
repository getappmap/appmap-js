import { Event } from '@appland/models';
import Assertion from '../assertion';
import { contentType } from './util';

const isRedirect = (status: number) => [301, 302, 303, 307, 308].includes(status);
const isNoContent = (status: number) => status != 204;

export default function (): Assertion {
  return Assertion.assert(
    'missing-content-type',
    'HTTP server requests without a Content-Type header',
    'http_server_request',
    (e: Event) => contentType(e) !== undefined,
    (assertion: Assertion): void => {
      assertion.where = (e: Event) =>
        e.httpServerResponse !== undefined &&
        !isRedirect(e.httpServerResponse!.status_code) &&
        !isNoContent(e.httpServerResponse!.status_code);
      assertion.description = `HTTP server request must have a Content-Type header`;
    }
  );
}
