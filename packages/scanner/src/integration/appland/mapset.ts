import { IncomingMessage } from 'http';

import { buildRequest, handleError } from '@appland/client/dist/src';

export type CreateResponse = {
  id: string;
  created_at: Date;
  updated_at: Date;
  user_id: number;
  app_id: number;
  branch?: string;
  commit?: string;
  environment?: string;
  version?: string;
};

export type CreateOptions = {
  branch?: string;
  commit?: string;
  environment?: string;
  version?: string;
};

export class Mapset {
  static async create(
    appId: string,
    appMapIds: string[],
    options: CreateOptions = {}
  ): Promise<CreateResponse> {
    console.log(`Creating mapset in app ${appId} with ${appMapIds.length} AppMaps`);

    const payload = JSON.stringify({
      app: appId,
      scenarios: appMapIds,
      ...options,
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
        return new Promise<CreateResponse>((resolve, reject) => {
          const responseData: Buffer[] = [];
          response
            .on('data', (chunk: Buffer) => {
              responseData.push(Buffer.from(chunk));
            })
            .on('end', () => {
              resolve(JSON.parse(Buffer.concat(responseData).toString()) as CreateResponse);
            })
            .on('error', reject);
        });
      });
  }
}
