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
import assert from 'assert';
import { existsSync } from 'fs';

// This import is used to ensure that the packaging follows the dependency.
require('./analyzeWorkerWrapper');

const TEST_ENV_WORKER_FILE = join(__dirname, '../../../built/cmds/archive/analyzeWorkerWrapper.js');
const WORKER_FILE = existsSync(TEST_ENV_WORKER_FILE)
  ? TEST_ENV_WORKER_FILE
  : join(__dirname, 'analyzeWorkerWrapper.js');

export default async function analyze(
  threadCount: number,
  maxAppMapSizeInBytes: number,
  compareFilter: CompareFilter,
  appMapDir: string
): Promise<{ oversizedAppMaps: string[] }> {
  warn(`Analyzing AppMaps using ${threadCount} worker threads`);

  const oversizedAppMaps = new Set<string>();

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

    const result = await processAppMapDir<SequenceDiagramTask, SequenceDiagramResult>(
      'Generate sequence diagrams',
      workerPool,
      task,
      appMapDir
    );

    const elapsed = new Date().getTime() - startTime;
    console.log(`Generated ${result.numProcessed} sequence diagrams in ${elapsed}ms`);
    for (const file of result.oversized) oversizedAppMaps.add(file);
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

    const result = await processAppMapDir<ScanTask, ScanResult>(
      'Scanning',
      workerPool,
      task,
      appMapDir,
      (_appmapFile: string, result: ScanResult) => {
        if (result.findingsCount) findingsCount += result.findingsCount;
      }
    );

    const elapsed = new Date().getTime() - startTime;
    console.log(
      `Scanned ${result.numProcessed} AppMaps in ${elapsed}ms, found ${findingsCount} findings`
    );
    for (const file of result.oversized) oversizedAppMaps.add(file);
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
