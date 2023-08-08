import assert from 'assert';
import { parentPort } from 'worker_threads';
import { buildAppMap, setSQLErrorHandler } from '@appland/models';

import sqlErrorLog from '../../lib/sqlErrorLog';
import { verbose } from '../../utils';
import { SequenceDiagramTask } from './SequenceDiagramTask';
import { readFile, stat } from 'fs/promises';
import buildFilter, { Language } from '../archive/buildFilter';
import { Specification, buildDiagram } from '@appland/sequence-diagram';
import { SequenceDiagramResult } from './SequenceDiagramResult';

if (!parentPort) throw new Error('parentPort is not defined');

setSQLErrorHandler(sqlErrorLog);

async function renderDiagram({
  appmapFile,
  maxSize,
  compareFilter,
  specOptions,
}: SequenceDiagramTask): Promise<SequenceDiagramResult> {
  const stats = await stat(appmapFile);
  if (stats.size > maxSize) {
    return { oversized: true };
  }

  const fullAppMap = buildAppMap()
    .source(await readFile(appmapFile, 'utf8'))
    .build();

  const language = fullAppMap.metadata?.language?.name || 'unknown';
  const filter = buildFilter(language as Language, compareFilter);
  const filteredAppMap = filter.filter(fullAppMap, []);
  const specification = Specification.build(filteredAppMap, specOptions);
  const diagram = buildDiagram(appmapFile, filteredAppMap, specification);

  return { diagram };
}

parentPort.on('message', async (task: SequenceDiagramTask) => {
  assert(parentPort);

  const { verbose: isVerbose } = task;
  if (isVerbose) verbose(isVerbose);

  let result: SequenceDiagramResult;
  try {
    result = await renderDiagram(task);
  } catch (err) {
    result = { error: err as Error };
  }
  parentPort.postMessage(result);
});
