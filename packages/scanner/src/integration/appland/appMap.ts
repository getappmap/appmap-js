import { IncomingMessage } from 'http';

import { buildRequest, handleError } from '@appland/client/dist/src';

export type UploadAppMapResponse = {
  uuid: string;
};

export class AppMap {
  static async upload(data: Buffer): Promise<UploadAppMapResponse> {
    const payload = JSON.stringify({
      data: data.toString(),
    });
    const request = await buildRequest('api/appmaps');
    return new Promise<IncomingMessage>((resolve, reject) => {
      const req = request.requestFunction(
        request.url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length,
            ...request.headers,
          },
        },
        resolve
      );
      req.on('error', reject);
      req.write(payload);
      req.end();
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
