import { basename, dirname, join } from 'path';
import WorkerPool from '../../lib/workerPool';
import { verbose } from '../../utils';
import { SequenceDiagramTask } from './SequenceDiagramTask';
import { writeFile } from 'fs/promises';
import { Diagram, FormatType, SequenceDiagramOptions, format } from '@appland/sequence-diagram';
import { CompareFilter } from '../../lib/loadAppMapConfig';
import processAppMapDir from '../../lib/processAppMapDir';

export async function generateSequenceDiagrams(
  appmapDir: string,
  threadCount: number,
  maxSize: number,
  compareFilter: CompareFilter
) {
  const workerPool = new WorkerPool(join(__dirname, 'sequenceDiagramWorker.js'), threadCount);

  const specOptions = {
    loops: true,
  } as SequenceDiagramOptions;

  const task = (file: string): SequenceDiagramTask => ({
    verbose: verbose(),
    appmapFile: file,
    maxSize,
    compareFilter,
    specOptions,
  });

  const resultHandler = async (appmapFile: string, diagram: Diagram) => {
    const indexDir = join(dirname(appmapFile), basename(appmapFile, '.appmap.json'));
    const diagramFileName = join(indexDir, 'sequence.json');
    const diagramOutput = format(FormatType.JSON, diagram, appmapFile);

    await writeFile(diagramFileName, diagramOutput.diagram);
  };

  await processAppMapDir('Generate sequence diagrams', workerPool, task, appmapDir, resultHandler);
}
