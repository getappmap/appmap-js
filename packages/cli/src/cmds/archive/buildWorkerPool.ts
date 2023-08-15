import assert from 'assert';
import WorkerPool from '../../lib/workerPool';
import { join } from 'path';
import { existsSync } from 'fs';

// This import is used to ensure that the packaging follows the dependency.
require('./analyzeWorkerWrapper');

const TEST_ENV_WORKER_FILE = join(__dirname, '../../../built/cmds/archive/analyzeWorkerWrapper.js');
const WORKER_FILE = existsSync(TEST_ENV_WORKER_FILE)
  ? TEST_ENV_WORKER_FILE
  : join(__dirname, 'analyzeWorkerWrapper.js');

export default function buildWorkerPool(threadCount: number): WorkerPool {
  assert(WORKER_FILE);
  return new WorkerPool(WORKER_FILE, threadCount);
}
