import assert from 'assert';
import { parentPort } from 'worker_threads';
import { setSQLErrorHandler } from '@appland/models';
import { scan } from '@appland/scanner';

import sqlErrorLog from '../../lib/sqlErrorLog';
import { ScanTask } from './ScanTask';
import { verbose } from '../../utils';

if (!parentPort) throw new Error('parentPort is not defined');

setSQLErrorHandler(sqlErrorLog);

parentPort.on('message', async (task: ScanTask) => {
  assert(parentPort);

  const { appmapFile, configurationFile, verbose: isVerbose } = task;

  if (isVerbose) verbose(isVerbose);

  try {
    const scanResults = await scan(appmapFile, configurationFile);
    parentPort.postMessage(scanResults);
  } catch (err) {
    parentPort.postMessage({ error: err });
  }
});
