import { queue, QueueObject } from 'async';
import FileTooLargeError from './fileTooLargeError';
import Fingerprinter from './fingerprinter';

function isNodeError(error: unknown, code?: string): error is NodeJS.ErrnoException {
  return error instanceof Error && (!code || (error as NodeJS.ErrnoException).code === code);
}

export default class FingerprintQueue {
  public handler: Fingerprinter;
  public failOnError = true;
  private lastError: unknown;
  private queue: QueueObject<string>;
  private pending = new Set<string>();

  constructor(private size = 2) {
    // eslint-disable-next-line no-use-before-define
    this.handler = new Fingerprinter();
    this.queue = queue(async (appmapFileName) => {
      try {
        await this.handler.fingerprint(appmapFileName);
      } catch (e) {
        console.warn(`Error fingerprinting ${appmapFileName}: ${e}`);
      }
      this.pending.delete(appmapFileName);
    }, this.size);
    this.queue.drain(() => (this.handler.checkVersion = false));
    this.queue.error((error) => {
      if (error instanceof FileTooLargeError) {
        console.warn(
          [
            `Skipped: ${error.message}`,
            'Tip: consider recording a shorter interaction or removing some classes from appmap.yml.',
          ].join('\n')
        );
      } else if (isNodeError(error, 'ENOENT')) {
        console.warn(`Skipped: ${error.path}\nThe file does not exist.`);
      } else if (this.failOnError) {
        this.lastError = error;
      } else {
        console.warn(`Skipped: ${error}`);
      }
    });
  }

  async process() {
    if (!this.queue.idle()) await this.queue.drain();
    if (this.lastError) throw this.lastError;
  }

  push(job: string) {
    if (this.pending.has(job)) return;
    this.pending.add(job);
    this.queue.push(job);
  }
}
