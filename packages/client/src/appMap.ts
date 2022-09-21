import { AppMap, Metadata } from '@appland/models';
import { IncomingMessage } from 'http';
import FormData from 'form-data';
import reportJSON from './reportJson';
import get from './get';
import { RetryOptions } from './retryOptions';
import retry from './retry';
import buildRequest from './buildRequest';
import retryOnError from './retryOnError';
import retryOn503 from './retryOn503';
import handleError from './handleError';

export type UploadAppMapResponse = {
  uuid: string;
};

export type CreateAppMapOptions = {
  app?: string;
  metadata?: Metadata;
};

export default class {
  constructor(public uuid: string) {}

  async get(): Promise<AppMap> {
    const requestPath = ['api/appmaps', this.uuid].join('/');
    return get(requestPath).then((response) => reportJSON<AppMap>(response));
  }

  static async create(
    data: Buffer,
    options: CreateAppMapOptions,
    retryOptions: RetryOptions = {}
  ): Promise<UploadAppMapResponse> {
    const makeRequest = async (): Promise<IncomingMessage> => {
      const retrier = retry(`Upload AppMap`, retryOptions, makeRequest);
      const form = new FormData();
      form.append('data', data.toString());
      if (options.metadata) {
        form.append('metadata', JSON.stringify(options.metadata));
      }
      if (options.app) {
        form.append('app', options.app);
      }
      const request = await buildRequest('api/appmaps');
      return new Promise<IncomingMessage>((resolve, reject) => {
        const interaction = request.requestFunction(
          request.url,
          {
            method: 'POST',
            headers: {
              ...request.headers,
              ...form.getHeaders(),
            },
          },
          resolve
        );
        interaction.on('error', retryOnError(retrier, resolve, reject));
        form.pipe(interaction);
      }).then(retryOn503(retrier));
    };

    return makeRequest()
      .then(handleError)
      .then(
        (response: IncomingMessage) =>
          new Promise<UploadAppMapResponse>((resolve, reject) => {
            const responseData: Buffer[] = [];
            response
              .on('data', (chunk: Buffer) => {
                responseData.push(Buffer.from(chunk));
              })
              .on('end', () => {
                resolve(JSON.parse(Buffer.concat(responseData).toString()) as UploadAppMapResponse);
              })
              .on('error', reject);
          })
      );
  }
}
