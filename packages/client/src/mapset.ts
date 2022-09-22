import { IncomingMessage } from 'http';
import reportJson from './reportJson';
import App from './app';
import AppMapListItem from './appMapListItem';
import get from './get';
import { RetryOptions } from './retryOptions';
import verbose from './verbose';
import retry from './retry';
import buildRequest from './buildRequest';
import retryOnError from './retryOnError';
import retryOn503 from './retryOn503';
import handleError from './handleError';

export type CreateMapsetResponse = {
  id: number;
  name?: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  app_id: number;
  branch?: string;
  commit?: string;
  environment?: string;
  version?: string;
};

export type CreateMapsetOptions = {
  branch?: string;
  commit?: string;
  environment?: string;
  version?: string;
};

export default class Mapset {
  constructor(public app: App, public id: number) {}

  async listAppMaps(): Promise<AppMapListItem[]> {
    const requestPath = `api/mapsets?app=${this.app.fqname}&mapset=${this.id}`;
    return get(requestPath).then((response) => reportJson<AppMapListItem[]>(response));
  }

  static async create(
    appId: string,
    appMapIds: string[],
    options: CreateMapsetOptions,
    retryOptions: RetryOptions = {}
  ): Promise<CreateMapsetResponse> {
    if (verbose()) console.log(`Creating mapset in app ${appId} with ${appMapIds.length} AppMaps`);

    const payload = JSON.stringify({
      app: appId,
      appmaps: appMapIds,
      ...options,
    });

    async function makeRequest(): Promise<IncomingMessage> {
      const retrier = retry(`Create Mapset`, retryOptions, makeRequest);
      const request = await buildRequest('api/mapsets');
      return new Promise<IncomingMessage>((resolve, reject) => {
        const interaction = request.requestFunction(
          request.url,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
              ...request.headers,
            },
          },
          resolve
        );
        interaction.on('error', retryOnError(retrier, resolve, reject));
        interaction.write(payload);
        interaction.end();
      }).then(retryOn503(retrier));
    }

    return makeRequest()
      .then(handleError)
      .then((response) => reportJson<CreateMapsetResponse>(response));
  }
}
