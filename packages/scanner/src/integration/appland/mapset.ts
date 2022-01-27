import { IncomingMessage } from 'http';

import { buildRequest, handleError } from '@appland/client/dist/src';

export type CreateMapsetResponse = {
  id: string;
};

export class Mapset {
  static async create(appId: string, appMapIds: string[]): Promise<CreateMapsetResponse> {
    console.log(`Creating mapset in app ${appId} with ${appMapIds.length} AppMaps`);
    const payload = JSON.stringify({
      appMapIds,
    });
    const request = await buildRequest('api/mapsets');
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
        return new Promise<CreateMapsetResponse>((resolve, reject) => {
          const responseData: Buffer[] = [];
          response
            .on('data', (chunk: Buffer) => {
              responseData.push(Buffer.from(chunk));
            })
            .on('end', () => {
              resolve(JSON.parse(Buffer.concat(responseData).toString()) as CreateMapsetResponse);
            })
            .on('error', reject);
        });
      });
  }
}
