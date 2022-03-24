import { queue } from 'async';
import { readFile } from 'fs/promises';

import { AppMap as AppMapStruct } from '@appland/models';

import { verbose } from '../rules/lib/util';
import { ScanResults } from '../report/scanResults';
import {
  create as createAppMap,
  CreateOptions as CreateAppMapOptions,
  UploadAppMapResponse,
} from '../integration/appland/appMap/create';
import { create as createMapset } from '../integration/appland/mapset/create';
import {
  create as createScannerJob,
  UploadResponse,
} from '../integration/appland/scannerJob/create';
import { RetryOptions } from '../integration/appland/retryOptions';
import { branch as branchFromEnv, sha as commitFromEnv } from '../integration/vars';

export default async function create(
  scanResults: ScanResults,
  appId: string,
  mergeKey?: string,
  options: RetryOptions = {}
): Promise<UploadResponse> {
  if (verbose()) console.log(`Uploading AppMaps and findings to application '${appId}'`);

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
    if (verbose()) console.log(`Uploading AppMap ${filePath}`);

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

        return createAppMap(buffer, Object.assign(options, { ...createAppMapOptions, metadata }));
      })
      .then((appMap: UploadAppMapResponse) => {
        if (appMap) {
          appMapUUIDByFileName[filePath] = appMap.uuid;
        }
      })
      .then(() => callback())
      .catch(callback);
  }, 3);
  q.error((err, filePath: string) => {
    console.error(`An error occurred uploading ${filePath}: ${err}`);
  });
  if (verbose()) console.log(`Uploading ${relevantFilePaths.length} AppMaps`);
  q.push(relevantFilePaths);
  await q.drain();

  const mostFrequent = (counts: Record<string, number>): string | undefined => {
    if (Object.keys(counts).length === 0) return;

    const maxCount = Object.values(counts).reduce((max, count) => Math.max(max, count), 0);
    return Object.entries(counts).find((e) => e[1] === maxCount)![0];
  };

  const branch = branchFromEnv() || mostFrequent(branchCount);
  const commit = commitFromEnv() || mostFrequent(commitCount);
  const mapset = await createMapset(
    appId,
    Object.values(appMapUUIDByFileName),
    Object.assign(options, {
      branch,
      commit,
    })
  );

  console.warn('Uploading findings');

  return createScannerJob(scanResults, mapset.id, appMapUUIDByFileName, { mergeKey }, options);
}
