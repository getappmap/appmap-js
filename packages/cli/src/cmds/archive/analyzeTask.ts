import { ScanTask, isScanTask } from '../scan/ScanTask';
import { SequenceDiagramTask, isSequenceDiagramTask } from '../sequenceDiagram/SequenceDiagramTask';
import { ScanResult } from '../scan/ScanResult';
import { SequenceDiagramResult } from '../sequenceDiagram/SequenceDiagramResult';
import { readFile, stat, writeFile } from 'fs/promises';
import { scan } from '@appland/scanner';
import { basename, dirname, join } from 'path';
import buildFilter, { Language } from './buildFilter';
import { FormatType, Specification, buildDiagram, format } from '@appland/sequence-diagram';
import { IndexTask, isIndexTask } from '../index/IndexTask';
import { IndexResult } from '../index/IndexResult';
import Fingerprinter from '../../fingerprint/fingerprinter';
import { buildAppMap } from '@appland/models';

export async function analyzeTask(
  task: IndexTask | ScanTask | SequenceDiagramTask
): Promise<IndexResult | ScanResult | SequenceDiagramResult | undefined> {
  const writeIndexFile = async (data: string, fileName: string) => {
    const indexDir = join(dirname(task.appmapFile), basename(task.appmapFile, '.appmap.json'));
    await writeFile(join(indexDir, fileName), data);
  };

  let result: IndexResult | ScanResult | SequenceDiagramResult | undefined;
  if (isIndexTask(task)) {
    const handler = new Fingerprinter();
    handler.maxFileSizeInBytes = undefined; // This has already been checked
    const indexResult = await handler.fingerprint(task.appmapFile);
    if (indexResult) result = indexResult;
    else result = { numEvents: 0 };
  } else if (isScanTask(task)) {
    const scanResults = await scan(task.appmapFile, 'appmap-scanner.yml');
    await writeIndexFile(JSON.stringify(scanResults, null, 2), 'appmap-findings.json');
    result = { findingsCount: scanResults.findings.length };
  } else if (isSequenceDiagramTask(task)) {
    const appmap = buildAppMap()
      .source(await readFile(task.appmapFile, 'utf8'))
      .build();
    const language = appmap.metadata?.language?.name || 'unknown';
    const filter = buildFilter(language as Language, task.compareFilter);
    const filteredAppMap = filter.filter(appmap, []);
    const specification = Specification.build(filteredAppMap, task.specOptions);
    const diagram = buildDiagram(task.appmapFile, filteredAppMap, specification);
    const diagramData = format(FormatType.JSON, diagram, task.appmapFile).diagram;
    await writeIndexFile(diagramData, 'sequence.json');
    result = {};
  } else {
    throw new Error(`Unknown task`);
  }

  return result;
}
