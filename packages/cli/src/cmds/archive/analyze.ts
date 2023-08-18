import generateOpenAPI from './generateOpenAPI';
import { CompareFilter } from '../../lib/loadAppMapConfig';
import WorkerPool from '../../lib/workerPool';
import processAppMapDir from '../../lib/processAppMapDir';
import { verbose } from '../../utils';
import { ScanResult } from '../scan/ScanResult';
import { ScanTask } from '../scan/ScanTask';
import { generateSequenceDiagrams } from './generateSequenceDiagrams';

// Performs scan, sequence diagram generation, and OpenAPI generation for all AppMaps.
export default async function analyze(
  workerPool: WorkerPool,
  maxAppMapSizeInBytes: number,
  compareFilter: CompareFilter,
  appMapDir: string,
  oversizedAppMaps: Set<string>,
  doScan: boolean
): Promise<void> {
  const scan = async () => {
    let findingsCount = 0;
    const startTime = new Date().getTime();

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
      undefined,
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

  await generateSequenceDiagrams(
    workerPool,
    maxAppMapSizeInBytes,
    compareFilter,
    oversizedAppMaps,
    appMapDir
  );
  if (doScan) await scan();
  await generateOpenAPI(appMapDir, maxAppMapSizeInBytes);
}
