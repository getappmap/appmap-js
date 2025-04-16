import assert from 'node:assert';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isNativeError } from 'node:util/types';
import { parentPort } from 'node:worker_threads';

import { verbose } from '../utils';
import Fingerprinter, { FingerprintEvent } from './fingerprinter';

export type FingerprintTask = {
  verbose: boolean;
  appmapFile: string;
};

export type FingerprintTaskResult = {
  appmapFile: string;
  error?: Error;
  result?: FingerprintEvent;
};

if (parentPort) {
  const fingerprinter = new Fingerprinter();

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  parentPort.on('message', async (task: FingerprintTask) => {
    assert(parentPort);
    verbose(task.verbose);
    const result: FingerprintTaskResult = {
      appmapFile: task.appmapFile,
    };
    try {
      result.result = await fingerprinter.fingerprint(task.appmapFile);
    } catch (e) {
      assert(isNativeError(e));
      result.error = {
        ...e,
        name: e.name,
        message: e.message,
        stack: e.stack,
        cause: e.cause,
      };
    }
    parentPort.postMessage(result);
  });
}

const builtWorkerFile = join(__dirname, '../../built/fingerprint/fingerprintWorker.js');
export const FINGERPRINT_WORKER_FILE = existsSync(builtWorkerFile) ? builtWorkerFile : __filename;
