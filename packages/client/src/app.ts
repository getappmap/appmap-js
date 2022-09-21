import { IncomingMessage } from 'http';
import Mapset from './mapset';
import FindingStatusListItem from './findingStatusListItem';
import reportJson from './reportJson';
import get from './get';
import { RetryOptions } from './retryOptions';
import verbose from './verbose';
import retry from './retry';
import buildRequest from './buildRequest';
import retryOnError from './retryOnError';
import { retryOn503 } from '.';

export default class {
  constructor(public fqname: string) {}

  mapset(mapsetId: number) {
    return new Mapset(this, mapsetId);
  }

  async listFindingStatus(): Promise<FindingStatusListItem[]> {
    const requestPath = ['api', this.fqname, 'finding_status'].join('/');
    return get(requestPath).then((response) => reportJson<FindingStatusListItem[]>(response));
  }

  async exists(retryOptions: RetryOptions = {}): Promise<boolean> {
    const commandDescription = `Checking if app ${this.fqname} exists`;

    if (verbose()) console.log(commandDescription);

    const makeRequest = async (): Promise<IncomingMessage> => {
      const retrier = retry(commandDescription, retryOptions, makeRequest);
      const requestPath = ['api', this.fqname].join('/');
      const request = await buildRequest(requestPath);
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
  }
}
