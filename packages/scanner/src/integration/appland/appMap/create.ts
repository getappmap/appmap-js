import { IncomingMessage } from 'http';

import { buildRequest, handleError, retryOn503, retryOnError } from '@appland/client/dist/src';
import FormData from 'form-data';
import { Metadata } from '@appland/models';
import { RetryOptions } from '../retryOptions';
import retry from '../retry';

export type UploadAppMapResponse = {
  uuid: string;
};

export type CreateOptions = {
  app?: string;
  metadata?: Metadata;
} & RetryOptions;

export async function create(
  data: Buffer,
  options: CreateOptions = {}
): Promise<UploadAppMapResponse> {
  const retrier = retry(makeRequest);

  async function makeRequest(): Promise<IncomingMessage> {
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
      const req = request.requestFunction(
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
      req.on('error', retryOnError(retrier, resolve, reject));
      form.pipe(req);
    }).then(retryOn503(retrier));
  }

  return makeRequest()
    .then(handleError)
    .then((response: IncomingMessage) => {
      return new Promise<UploadAppMapResponse>((resolve, reject) => {
        const responseData: Buffer[] = [];
        response
          .on('data', (chunk: Buffer) => {
            responseData.push(Buffer.from(chunk));
          })
          .on('end', () => {
            resolve(JSON.parse(Buffer.concat(responseData).toString()) as UploadAppMapResponse);
          })
          .on('error', reject);
      });
    });
}
