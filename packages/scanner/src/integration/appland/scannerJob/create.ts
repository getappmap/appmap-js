import { IncomingMessage } from 'http';
import { queue } from 'async';
import { readFile } from 'fs/promises';
import { URL } from 'url';

import { AppMap as AppMapStruct } from '@appland/models';
import { buildRequest, handleError, reportJSON } from '@appland/client/dist/src';

import { ScanResults } from '../../../report/scanResults';
import {
  create as createAppMap,
  CreateOptions as CreateAppMapOptions,
  UploadAppMapResponse,
} from '../appMap/create';
import { create as createMapset } from '../mapset/create';
import Location from '../location';
import ScannerJob from '../scannerJob';
import { verbose } from 'src/rules/lib/util';

type CreateOptions = {
  scan_results: ScanResults;
  mapset: number;
  appmap_uuid_by_file_name: Record<string, string>;
  merge_key?: string;
};

export interface UploadResponse extends ScannerJob, Location {}

export async function create(
  scanResults: ScanResults,
  appId: string,
  mergeKey?: string
): Promise<UploadResponse> {
  console.warn(`Uploading AppMaps and findings to application '${appId}'`);

  const { findings } = scanResults;

  const relevantFilePaths = [
    ...new Set(findings.filter((f) => f.appMapFile).map((f) => f.appMapFile)),
  ] as string[];

  const appMapUUIDByFileName: Record<string, string> = {};
  const branchCount: Record<string, number> = {};
  const commitCount: Record<string, number> = {};

  const createAppMapOptions = {
    app: appId,
  } as CreateAppMapOptions;

  const q = queue((filePath: string, callback) => {
    console.log(`Uploading AppMap ${filePath}`);

    readFile(filePath)
      .then((buffer: Buffer) => {
        const appMapStruct = JSON.parse(buffer.toString()) as AppMapStruct;
        const metadata = appMapStruct.metadata;
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

        return createAppMap(buffer, { ...createAppMapOptions, metadata });
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
  const mapset = await createMapset(appId, Object.values(appMapUUIDByFileName), {
    branch,
    commit,
  });

  console.warn('Uploading findings');

  const createScannerJobOptions = {
    scan_results: scanResults,
    mapset: mapset.id,
    appmap_uuid_by_file_name: appMapUUIDByFileName,
  } as CreateOptions;
  if (mergeKey) createScannerJobOptions.merge_key = mergeKey;
  const scanResultsData = JSON.stringify(createScannerJobOptions);

  const request = await buildRequest('api/scanner_jobs');
  let uploadURL: URL;
  return new Promise<IncomingMessage>((resolve, reject) => {
    const req = request.requestFunction(
      request.url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': scanResultsData.length,
          ...request.headers,
        },
      },
      resolve
    );
    req.on('error', reject);
    req.write(scanResultsData);
    req.end();
  })
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
