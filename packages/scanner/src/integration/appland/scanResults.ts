import { IncomingMessage } from 'http';

import { buildRequest, handleError } from '@appland/client/dist/src';

export type MergeResponse = {
  id: number;
};

export class ScanResults {
  static async merge(appId: string, mergeKey: string): Promise<MergeResponse> {
    console.log(`Merging scan results in app ${appId} with merge key ${mergeKey}`);

    const payload = JSON.stringify({
      app: appId,
      merge_key: mergeKey,
    });
    const request = await buildRequest('api/scanner_jobs/merge');
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
        return new Promise<MergeResponse>((resolve, reject) => {
          const responseData: Buffer[] = [];
          response
            .on('data', (chunk: Buffer) => {
              responseData.push(Buffer.from(chunk));
            })
            .on('end', () => {
              resolve(JSON.parse(Buffer.concat(responseData).toString()) as MergeResponse);
            })
            .on('error', reject);
        });
      });
  }
}
