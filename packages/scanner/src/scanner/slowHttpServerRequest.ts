import { Event } from '@appland/models';
import Assertion from '../assertion';

export default function (timeAllowed = 1): Assertion {
  return Assertion.assert(
    'slow-http-server-request',
    'http_server_request',
    (e: Event) => e.elapsedTime !== undefined && e.elapsedTime < timeAllowed,
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => e.elapsedTime !== undefined;
      assertion.description = `Slow HTTP server request (> ${timeAllowed * 1000}ms)`;
    }
  );
}
