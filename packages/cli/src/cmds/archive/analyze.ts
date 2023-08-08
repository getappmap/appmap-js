import updateSequenceDiagrams from './updateSequenceDiagrams';
import generateOpenAPI from './generateOpenAPI';
import { indexAppMaps } from './indexAppMaps';
import { CompareFilter } from '../../lib/loadAppMapConfig';
import WorkerPool from '../../lib/workerPool';
import { join } from 'path';
import { SequenceDiagramOptions } from '@appland/sequence-diagram';
import processAppMapDir from '../../lib/processAppMapDir';
import { verbose } from '../../utils';
import { SequenceDiagramTask } from '../sequenceDiagram/SequenceDiagramTask';
import { SequenceDiagramResult } from '../sequenceDiagram/SequenceDiagramResult';
import { ScanResult } from '../scan/ScanResult';
import { ScanTask } from '../scan/ScanTask';
import { warn } from 'console';
import { existsSync } from 'fs';
import assert from 'assert';

const WORKER_FILE = [
  join(__dirname, 'analyzeWorker.js'),
  join(__dirname, '../../../built/cmds/archive', 'analyzeWorker.js'),
].find((file) => existsSync(file));
if (!WORKER_FILE) throw new Error('analyzeWorker.js not found');

export default async function analyze(
  threadCount: number,
  maxAppMapSizeInBytes: number,
  compareFilter: CompareFilter,
  appMapDir: string
): Promise<{ oversizedAppMaps: string[] }> {
  warn(`Analyzing AppMaps using ${threadCount} worker threads`);

  const oversizedAppMaps = new Set<string>();
  const collectOversizedAppMaps = (
    appmapFile: string,
    result: ScanResult | SequenceDiagramResult
  ) => {
    if (result.oversized) oversizedAppMaps.add(appmapFile);
  };

  // This could be done in worker threads as well, but the timing data indicates that it's not currently a bottleneck.
  {
    console.log(`Indexing AppMaps...`);
    const startTime = new Date().getTime();
    const numIndexed = await indexAppMaps(appMapDir, maxAppMapSizeInBytes);
    const elapsed = new Date().getTime() - startTime;
    console.log(`Indexed ${numIndexed} AppMaps in ${elapsed}ms`);
  }

  {
    const startTime = new Date().getTime();
    console.log('Generating OpenAPI...');
    await generateOpenAPI(appMapDir, maxAppMapSizeInBytes);
    const elapsed = new Date().getTime() - startTime;
    console.log(`Generated OpenAPI in ${elapsed}ms`);
  }

  const generateSequenceDiagrams = async () => {
    const specOptions = {
      loops: true,
    } as SequenceDiagramOptions;

    const task = (file: string): SequenceDiagramTask => ({
      name: 'sequence-diagram',
      verbose: verbose(),
      appmapFile: file,
      maxSize: maxAppMapSizeInBytes,
      compareFilter,
      specOptions,
    });

    console.log('Generating sequence diagrams...');
    const startTime = new Date().getTime();

    const fileCount = await processAppMapDir<SequenceDiagramTask, SequenceDiagramResult>(
      'Generate sequence diagrams',
      workerPool,
      task,
      appMapDir,
      collectOversizedAppMaps
    );

    const elapsed = new Date().getTime() - startTime;
    console.log(`Generated ${fileCount} sequence diagrams in ${elapsed}ms`);
  };

  const scan = async () => {
    let findingsCount = 0;
    const startTime = new Date().getTime();
    console.log('Scanning...');

    const task = (file: string): ScanTask => ({
      name: 'scan',
      verbose: verbose(),
      appmapFile: file,
      maxSize: maxAppMapSizeInBytes,
    });

    const fileCount = await processAppMapDir<ScanTask, ScanResult>(
      'Scanning',
      workerPool,
      task,
      appMapDir,
      (appmapFile: string, result: ScanResult) => {
        collectOversizedAppMaps(appmapFile, result);
        if (result.findingsCount) findingsCount += result.findingsCount;
      }
    );

    const elapsed = new Date().getTime() - startTime;
    console.log(`Scanned ${fileCount} AppMaps in ${elapsed}ms, found ${findingsCount} findings`);
  };

  assert(WORKER_FILE);
  const workerPool = new WorkerPool(WORKER_FILE, threadCount);
  try {
    await generateSequenceDiagrams();
    await scan();
  } finally {
    workerPool.close();
  }

  return { oversizedAppMaps: [...oversizedAppMaps].sort() };
}
