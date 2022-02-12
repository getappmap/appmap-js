import { IncomingMessage } from 'http';

import { buildRequest, handleError, reportJSON } from '@appland/client/dist/src';
import Location from '../location';
import ScannerJob from '../scannerJob';
import { URL } from 'url';

export interface MergeResponse extends ScannerJob, Location {}

export async function merge(appId: string, mergeKey: string): Promise<MergeResponse> {
  console.log(`Merging scan results in app ${appId} with merge key ${mergeKey}`);

  const payload = JSON.stringify({
    app: appId,
    merge_key: mergeKey,
  });
  const request = await buildRequest('api/scanner_jobs/merge');
  let uploadURL: URL;
  return new Promise<IncomingMessage>((resolve, reject) => {
    const req = request.requestFunction(
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
    req.on('error', reject);
    req.write(payload);
    req.end();
  })
    .then(handleError)
    .then((response) => {
      if (response.headers.location) {
        uploadURL = new URL(response.headers.location, request.url.href);
      }
      return reportJSON<MergeResponse>(response);
    })
    .then((uploadResponse) => {
      uploadResponse.url = uploadURL;
      return uploadResponse;
    });
}
