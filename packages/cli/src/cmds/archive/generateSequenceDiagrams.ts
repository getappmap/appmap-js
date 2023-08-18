import { CompareFilter } from '../../lib/loadAppMapConfig';
import WorkerPool from '../../lib/workerPool';
import processAppMapDir from '../../lib/processAppMapDir';
import { verbose } from '../../utils';
import { SequenceDiagramTask } from '../sequenceDiagram/SequenceDiagramTask';
import { SequenceDiagramResult } from '../sequenceDiagram/SequenceDiagramResult';
import { SequenceDiagramOptions } from '@appland/sequence-diagram';

export async function generateSequenceDiagrams(
  workerPool: WorkerPool,
  maxAppMapSizeInBytes: number,
  compareFilter: CompareFilter,
  oversizedAppMaps: Set<string>,
  appMapDir: string
) {
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

  const startTime = new Date().getTime();

  const result = await processAppMapDir<SequenceDiagramTask, SequenceDiagramResult>(
    'Generating sequence diagrams',
    workerPool,
    task,
    appMapDir
  );

  const elapsed = new Date().getTime() - startTime;
  console.log(`Generated ${result.numProcessed} sequence diagrams in ${elapsed}ms`);
  for (const file of result.oversized) oversizedAppMaps.add(file);
}
