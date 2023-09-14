import assert from 'assert';
import { parentPort } from 'worker_threads';
assert(parentPort);

import { setSQLErrorHandler } from '@appland/models';

import sqlErrorLog from '../../lib/sqlErrorLog';
import { verbose } from '../../utils';
import { ScanTask } from '../scan/ScanTask';
import { SequenceDiagramTask } from '../sequenceDiagram/SequenceDiagramTask';
import { stat } from 'fs/promises';
import { IndexTask } from '../index/IndexTask';
import { analyzeTask } from './analyzeTask';

setSQLErrorHandler(sqlErrorLog);

parentPort.on('message', async (task: IndexTask | ScanTask | SequenceDiagramTask) => {
  assert(parentPort);
  if (task.verbose) verbose(task.verbose);

  try {
    const stats = await stat(task.appmapFile);
    if (stats.size > task.maxSize) {
      parentPort.postMessage({ oversized: true });
      return;
    }

    const result = await analyzeTask(task);
    if (result) parentPort.postMessage({ result });
  } catch (err) {
    parentPort.postMessage({ error: err });
  }
});
