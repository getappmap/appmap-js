import { IncomingMessage } from 'http';
import { URL } from 'url';

import {
  buildRequest,
  handleError,
  reportJSON,
  retryOn503,
  retryOnError,
} from '@appland/client/dist/src';

import { verbose } from '../../../rules/lib/util';
import { ScanResults } from '../../../report/scanResults';
import Location from '../location';
import ScannerJob from '../scannerJob';
import { RetryOptions } from '../retryOptions';
import retry from '../retry';
import { Request } from '@appland/client/dist/src/buildRequest';

type CreateOptions = {
  mergeKey?: string;
};

export interface UploadResponse extends ScannerJob, Location {}

export async function create(
  scanResults: ScanResults,
  mapsetId: number,
  appMapUUIDByFileName: Record<string, string>,
  createOptions: CreateOptions = {},
  retryOptions: RetryOptions = {}
): Promise<UploadResponse> {
  if (verbose()) console.warn('Uploading findings');

  let uploadURL: URL;
  let request: Request;
  const retrier = retry(`Create scanner job`, retryOptions, makeRequest);

  async function makeRequest(): Promise<IncomingMessage> {
    const payload = JSON.stringify({
      scan_results: scanResults,
      mapset: mapsetId,
      appmap_uuid_by_file_name: appMapUUIDByFileName,
      ...{ merge_key: createOptions.mergeKey },
    });

    request = await buildRequest('api/scanner_jobs');
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
      req.on('error', retryOnError(retrier, resolve, reject));
      req.write(payload);
      req.end();
    }).then(retryOn503(retrier));
  }
  return makeRequest()
    .then(handleError)
    .then((response) => {
      if (response.headers.location) {
        uploadURL = new URL(response.headers.location, request.url.href);
      }
      return reportJSON<UploadResponse>(response);
    })
    .then((uploadResponse) => {
      uploadResponse.url = uploadURL;
      return uploadResponse;
    });
}
