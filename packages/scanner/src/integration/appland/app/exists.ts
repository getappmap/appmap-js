import { IncomingMessage } from 'http';

import { buildRequest, retryOn503, retryOnError } from '@appland/client/dist/src';
import { verbose } from '../../../rules/lib/util';
import { RetryOptions } from '../retryOptions';
import retry from '../retry';

export async function exists(appId: string, retryOptions: RetryOptions = {}): Promise<boolean> {
  const commandDescription = `Checking if app ${appId} exists`;
  if (verbose()) console.log(commandDescription);

  const retrier = retry(commandDescription, retryOptions, makeRequest);

  async function makeRequest(): Promise<IncomingMessage> {
    const requestPath = ['api', appId].join('/');
    const request = await buildRequest(requestPath);
    return new Promise<IncomingMessage>((resolve, reject) => {
      const req = request.requestFunction(
        request.url,
        {
          method: 'HEAD',
          headers: request.headers,
        },
        resolve
      );
      req.on('error', retryOnError(retrier, resolve, reject));
      req.end();
    }).then(retryOn503(retrier));
  }

  return makeRequest().then(async (response: IncomingMessage): Promise<boolean> => {
    if (verbose()) console.log(`${commandDescription}: statusCode=${response.statusCode}`);

    if (!response.statusCode) {
      throw new Error('No status code was provided by the server');
    }
    if (response.statusCode === 404) {
      return false;
    } else if (response.statusCode! < 300) {
      return true;
    }
    throw new Error(`Unexpected status code: ${response.statusCode}`);
  });
}
