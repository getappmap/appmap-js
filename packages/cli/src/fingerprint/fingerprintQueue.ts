import { EventEmitter } from 'node:events';

import WorkerPool from '../lib/workerPool';
import { isNodeError, verbose } from '../utils';
import FileTooLargeError from './fileTooLargeError';
import {
  FINGERPRINT_WORKER_FILE,
  type FingerprintTask,
  type FingerprintTaskResult,
} from './fingerprintWorker';
import type { FingerprintEvent } from './fingerprinter';

/**
 * FingerprintQueue manages parallel processing of AppMap files using a worker pool.
 *
 * Each AppMap file is processed by a worker thread which:
 * 1. Reads and validates the AppMap file
 * 2. Generates a fingerprint (canonicalized representation)
 * 3. Saves the fingerprint to the index directory
 *
 * Error handling:
 * - FileTooLargeError: Logs a warning and skips the file
 * - ENOENT (file not found): Logs a warning and skips the file
 * - Other errors: Stores the error and continues processing other files
 *   The error will be thrown when process() is called
 *
 * Events:
 * - 'index': Emitted when an AppMap is successfully fingerprinted
 *   Payload: FingerprintEvent containing numEvents and metadata
 *
 * Example:
 * ```typescript
 * const queue = new FingerprintQueue(4); // 4 worker threads
 * queue.on('index', ({ numEvents, metadata }) => {
 *   console.log(`Indexed AppMap with ${numEvents} events`);
 * });
 * queue.push('path/to/appmap.json');
 * await queue.process(); // Wait for all files to be processed
 * ```
 *
 * @emits index - Emitted when an AppMap is successfully fingerprinted
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class FingerprintQueue extends EventEmitter {
  private lastError: unknown;
  private pending = new Set<string>();
  private pool: WorkerPool;

  constructor(numThreads = 2) {
    super();
    this.pool = new WorkerPool(FINGERPRINT_WORKER_FILE, numThreads);
  }

  #processed(err: Error | null, { error, result, appmapFile }: FingerprintTaskResult) {
    this.pending.delete(appmapFile);
    if (err) {
      console.warn(`Error fingerprinting ${appmapFile}: ${String(err)}`);
      return;
    }

    if (error) {
      // eslint-disable-next-line no-param-reassign
      error = WorkerPool.recoverError(error);
      // Note errors transported over IPC won't have the same prototype.
      if (error.name === 'FileTooLargeError') {
        console.warn(
          [
            `Skipped: ${error.message}`,
            'Tip: consider recording a shorter interaction or removing some classes from appmap.yml.',
          ].join('\n')
        );
      } else if (isNodeError(error, 'ENOENT')) {
        console.warn(`Skipped: ${appmapFile}\nThe file does not exist.`);
      } else {
        console.warn(`Skipped: ${String(error)}`);
        this.lastError = err ?? error;
      }
    }
    if (result) this.emit('index', result);
  }

  async process() {
    await this.pool.drain();
    if (this.lastError) throw this.lastError;
  }

  push(job: string) {
    if (this.pending.has(job)) return;
    this.pending.add(job);
    this.pool.runTask(makeTask(job), this.#processed.bind(this));
  }
}

function makeTask(appmapFile: string): FingerprintTask {
  return {
    verbose: verbose(),
    appmapFile,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
interface FingerprintQueue {
  on(event: 'index', listener: (data: FingerprintEvent) => void): this;
  emit(event: 'index', data: FingerprintEvent): boolean;
}

export default FingerprintQueue;
