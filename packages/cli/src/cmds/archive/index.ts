import WorkerPool from '../../lib/workerPool';
import processAppMapDir from '../../lib/processAppMapDir';
import { findFiles, verbose } from '../../utils';
import { IndexTask } from '../index/IndexTask';
import { IndexResult } from '../index/IndexResult';
import { basename, dirname, join } from 'path';
import { readFile } from 'fs/promises';
import { Metadata } from '@appland/models';
import emitUsage from '../../lib/emitUsage';

export async function index(
  workerPool: WorkerPool,
  maxAppMapSizeInBytes: number,
  appMapDir: string,
  oversizedAppMaps: Set<string>,
  failedTests: Set<string>
) {
  const task = (file: string): IndexTask => ({
    name: 'index',
    verbose: verbose(),
    appmapFile: file,
    maxSize: maxAppMapSizeInBytes,
  });

  const startTime = new Date().getTime();

  let sampleMetadata: Metadata | undefined;
  let totalEvents = 0;
  const result = await processAppMapDir<IndexTask, IndexResult>(
    'Indexing AppMaps',
    workerPool,
    task,
    appMapDir,
    undefined,
    async (_appmap, { result: { metadata, numEvents } }) => {
      if (!sampleMetadata) sampleMetadata = metadata;
      totalEvents += numEvents;
    }
  );

  await emitUsage(appMapDir, totalEvents, result.numProcessed, sampleMetadata);

  const elapsed = new Date().getTime() - startTime;
  console.log(`Indexed ${result.numProcessed} AppMaps in ${elapsed}ms`);
  for (const file of result.oversized) oversizedAppMaps.add(file);

  const metadataFiles = await findFiles(appMapDir, (file) => basename(file) === 'metadata.json');
  for (const file of metadataFiles) {
    const metadata = JSON.parse(await readFile(file, 'utf-8')) as Metadata;
    const appmapFile = [dirname(file), '.appmap.json'].join('');
    if (metadata.test_status === 'failed') failedTests.add(appmapFile);
  }
}
