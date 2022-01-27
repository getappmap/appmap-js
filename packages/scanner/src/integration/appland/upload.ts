import { promises as fs } from 'fs';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { buildRequest, handleError } from '@appland/client/dist/src';

import { ScanResults } from '../../report/scanResults';
import { AppMap as AppMapClient } from './appMap';
import { Mapset as MapsetClient } from './mapset';
import { join } from 'path';

export default async function (
  scanResults: ScanResults,
  appId: string,
  appmapDir: string
): Promise<URL> {
  process.stderr.write(`Uploading findings to application '${appId}'\n`);

  const { findings } = scanResults;

  const relevantFilePaths = [
    ...new Set(findings.filter((f) => f.appMapFile).map((f) => f.appMapFile)),
  ] as string[];

  // TODO: Can do these in parallel
  const appMapIds: Record<string, string> = {};
  for (const filePath of relevantFilePaths) {
    console.log(`Uploading AppMap ${filePath}`);
    const buffer = await fs.readFile(join(appmapDir, filePath));
    const appMap = await AppMapClient.upload(buffer);
    if (appMap) {
      appMapIds[filePath] = appMap.uuid;
    }
  }

  const mapsetId = MapsetClient.create(appId, Object.values(appMapIds));

  const uploadData = JSON.stringify({
    scanResults,
    mapsetId,
    appId,
  });

  const request = await buildRequest('api/scanner_jobs');
  return new Promise<IncomingMessage>((resolve, reject) => {
    const req = request.requestFunction(
      request.url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': uploadData.length,
          ...request.headers,
        },
      },
      resolve
    );
    req.on('error', reject);
    req.write(uploadData);
    req.end();
  })
    .then(handleError)
    .then((response: IncomingMessage): URL => {
      let message = `Uploaded ${scanResults.findings.length} findings`;
      if (response.headers.location) {
        const uploadURL = new URL(response.headers.location, request.url.href);
        message += ` to ${uploadURL}`;
      }
      console.log(message);
      return request.url;
    });
}
