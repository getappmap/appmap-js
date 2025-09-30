import { IncomingMessage } from 'http';
import buildRequest from './buildRequest';
import { RetryOptions } from './retryOptions';
import retry from './retry';
import retryOnError from './retryOnError';
import { retryOn503 } from '.';
import verbose from './verbose';

export default {
  async check(licenseKey: string, retryOptions: RetryOptions = {}): Promise<boolean> {
    const commandDescription = `Checking if API key is valid`;
    const makeRequest = async (): Promise<IncomingMessage> => {
      const retrier = retry(commandDescription, retryOptions, makeRequest);
      const requestPath = ['api', 'api_keys', 'check'].join('/');
      const request = buildRequest(requestPath, { requireApiKey: false });
      request.headers.authorization = `Bearer ${licenseKey}`;
      return new Promise<IncomingMessage>((resolve, reject) => {
        const interaction = request.requestFunction(
          request.url,
          {
            method: 'HEAD',
            headers: request.headers,
          },
          resolve
        );
        interaction.on('error', retryOnError(retrier, resolve, reject));
        interaction.end();
      }).then(retryOn503(retrier));
    };

    return makeRequest().then((response: IncomingMessage): boolean => {
      if (verbose())
        console.log(`${commandDescription}: statusCode=${response.statusCode || '<none>'}`);

      // drain the response to avoid hanging sockets
      response.on('data', () => {});
      response.on('end', () => {});

      if (!response.statusCode) {
        throw new Error('No status code was provided by the server');
      }
      if (response.statusCode === 404) {
        return false;
      }
      if (response.statusCode < 300) {
        return true;
      }
      throw new Error(`Unexpected status code: ${response.statusCode}`);
    });
  },
};
