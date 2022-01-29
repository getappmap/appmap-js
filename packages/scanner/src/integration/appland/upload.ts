import { promises as fs } from 'fs';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { AppMap as AppMapStruct } from '@appland/models';
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

  const appMapUUIDByFileName: Record<string, string> = {};
  const branchCount: Record<string, number> = {};
  const commitCount: Record<string, number> = {};

  // TODO: Can do these in concurrent batches
  for (const filePath of relevantFilePaths) {
    console.log(`Uploading AppMap ${filePath}`);
    const buffer = await fs.readFile(join(appmapDir, filePath));
    const appMapStruct = JSON.parse(buffer.toString()) as AppMapStruct;
    const branch = appMapStruct.metadata.git?.branch;
    const commit = appMapStruct.metadata.git?.commit;
    if (branch) {
      branchCount[branch] ||= 1;
      branchCount[branch] += 1;
    }
    if (commit) {
      commitCount[commit] ||= 1;
      commitCount[commit] += 1;
    }

    const appMap = await AppMapClient.upload(buffer, { app: appId });
    if (appMap) {
      appMapUUIDByFileName[filePath] = appMap.uuid;
    }
  }

  const mostFrequent = (counts: Record<string, number>): string => {
    const maxCount = Object.values(counts).reduce((max, count) => Math.max(max, count), 0);
    return Object.entries(counts).find((e) => e[1] === maxCount)![0];
  };

  const branch = mostFrequent(branchCount);
  const commit = mostFrequent(commitCount);
  const mapset = await MapsetClient.create(appId, Object.values(appMapUUIDByFileName), {
    branch,
    commit,
  });

  const uploadData = JSON.stringify({
    scan_results: scanResults,
    mapset: mapset.id,
    appmap_uuid_by_file_name: appMapUUIDByFileName,
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
