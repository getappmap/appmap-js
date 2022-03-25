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
import {
  create as createMapset,
  CreateOptions as CreateMapsetOptions,
} from '../integration/appland/mapset/create';
import {
  create as createScannerJob,
  UploadResponse,
} from '../integration/appland/scannerJob/create';
import { RetryOptions } from '../integration/appland/retryOptions';
import { branch as branchFromEnv, sha as commitFromEnv } from '../integration/vars';
import { stat } from 'fs/promises';
import { join } from 'path';

async function fileExists(file: string): Promise<boolean> {
  try {
    await stat(file);
    return true;
  } catch (e) {
    return false;
  }
}

export default async function create(
  scanResults: ScanResults,
  appId: string,
  appMapDir: string,
  mergeKey?: string,
  mapsetOptions: CreateMapsetOptions = {},
  retryOptions: RetryOptions = {}
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

  const q = queue(async (filePath: string, callback) => {
    if (verbose()) console.log(`Uploading AppMap ${filePath}`);

    const filePaths = [filePath, join(appMapDir, filePath)];

    const filePathsExist = await Promise.all(filePaths.map(fileExists));
    const fullPath = filePaths.find((_, fileIndex) => filePathsExist[fileIndex]);
    if (!fullPath) throw new Error(`File ${filePath} not found`);

    readFile(fullPath)
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

        return createAppMap(
          buffer,
          Object.assign(retryOptions, { ...createAppMapOptions, metadata })
        );
      })
      .then((appMap: UploadAppMapResponse) => {
        if (appMap) {
          appMapUUIDByFileName[filePath] = appMap.uuid;
        }
      })
      .then(() => callback(null))
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

  mapsetOptions.branch ||= branchFromEnv() || mostFrequent(branchCount);
  mapsetOptions.commit ||= commitFromEnv() || mostFrequent(commitCount);
  const mapset = await createMapset(
    appId,
    Object.values(appMapUUIDByFileName),
    mapsetOptions,
    retryOptions
  );

  console.warn('Uploading findings');

  return createScannerJob(scanResults, mapset.id, appMapUUIDByFileName, { mergeKey }, retryOptions);
}
