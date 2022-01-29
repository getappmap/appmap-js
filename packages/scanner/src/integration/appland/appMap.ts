import { IncomingMessage } from 'http';

import { buildRequest, handleError } from '@appland/client/dist/src';
import FormData from 'form-data';

export type UploadAppMapResponse = {
  uuid: string;
};

export type CreateOptions = {
  app?: string;
};

export class AppMap {
  static async upload(data: Buffer, options: CreateOptions = {}): Promise<UploadAppMapResponse> {
    const form = new FormData();
    form.append('data', data.toString());
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
      req.on('error', reject);
      form.pipe(req);
    })
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
}
