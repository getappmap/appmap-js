import assert from 'assert';
import { parentPort } from 'worker_threads';
assert(parentPort);

import { buildAppMap, setSQLErrorHandler } from '@appland/models';

import sqlErrorLog from '../../lib/sqlErrorLog';
import { verbose } from '../../utils';
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

setSQLErrorHandler(sqlErrorLog);

parentPort.on('message', async (task: IndexTask | ScanTask | SequenceDiagramTask) => {
  assert(parentPort);
  if (task.verbose) verbose(task.verbose);

  const writeIndexFile = async (data: string, fileName: string) => {
    const indexDir = join(dirname(task.appmapFile), basename(task.appmapFile, '.appmap.json'));
    await writeFile(join(indexDir, fileName), data);
  };

  try {
    const stats = await stat(task.appmapFile);
    if (stats.size > task.maxSize) {
      parentPort.postMessage({ oversized: true });
      return;
    }

    let result: IndexResult | ScanResult | SequenceDiagramResult;
    if (isIndexTask(task)) {
      const handler = new Fingerprinter();
      handler.maxFileSizeInBytes = undefined; // This has already been checked
      await handler.fingerprint(task.appmapFile);
      result = {};
    } else if (isScanTask(task)) {
      const scanResults = await scan(task.appmapFile, 'appmap-scanner.yml');
      writeIndexFile(JSON.stringify(scanResults, null, 2), 'appmap-findings.json');
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
      writeIndexFile(diagramData, 'sequence.json');
      result = {};
    } else {
      throw new Error(`Unknown task`);
    }

    parentPort.postMessage(result);
  } catch (err) {
    parentPort.postMessage({ error: err });
  }
});
