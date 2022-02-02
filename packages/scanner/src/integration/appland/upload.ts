import { IncomingMessage } from 'http';
import { URL } from 'url';
import { queue } from 'async';

import { AppMap as AppMapStruct } from '@appland/models';
import { buildRequest, handleError } from '@appland/client/dist/src';

import { ScanResults } from '../../report/scanResults';
import { AppMap as AppMapClient, UploadAppMapResponse } from './appMap';
import { Mapset as MapsetClient } from './mapset';
import { join } from 'path';
import { readFile } from 'fs/promises';

export default async function (
  scanResults: ScanResults,
  appId: string,
  appmapDir: string
): Promise<URL> {
  console.warn(`Uploading AppMaps and findings to application '${appId}'`);

  const { findings } = scanResults;

  const relevantFilePaths = [
    ...new Set(findings.filter((f) => f.appMapFile).map((f) => f.appMapFile)),
  ] as string[];

  const appMapUUIDByFileName: Record<string, string> = {};
  const branchCount: Record<string, number> = {};
  const commitCount: Record<string, number> = {};

  const q = queue((filePath: string, callback) => {
    console.log(`Uploading AppMap ${filePath}`);

    readFile(join(appmapDir, filePath))
      .then((buffer: Buffer) => {
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

        return AppMapClient.upload(buffer, { app: appId });
      })
      .then((appMap: UploadAppMapResponse) => {
        if (appMap) {
          appMapUUIDByFileName[filePath] = appMap.uuid;
        }
      })
      .then(() => callback())
      .catch(callback);
  }, 5);
  q.error((err, filePath: string) => {
    console.error(`An error occurred uploading ${filePath}: ${err}`);
  });
  console.log(`Uploading ${relevantFilePaths.length} AppMaps`);
  q.push(relevantFilePaths);
  await q.drain();

  const mostFrequent = (counts: Record<string, number>): string | undefined => {
    if (Object.keys(counts).length === 0) return;

    const maxCount = Object.values(counts).reduce((max, count) => Math.max(max, count), 0);
    return Object.entries(counts).find((e) => e[1] === maxCount)![0];
  };

  const branch = mostFrequent(branchCount);
  const commit = mostFrequent(commitCount);
  const mapset = await MapsetClient.create(appId, Object.values(appMapUUIDByFileName), {
    branch,
    commit,
  });

  console.warn('Uploading findings');

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
