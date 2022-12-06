import { queue, QueueObject } from 'async';
import FileTooLargeError from './fileTooLargeError';
import Fingerprinter from './fingerprinter';

function isNodeError(error: unknown, code?: string): error is NodeJS.ErrnoException {
  return error instanceof Error && (!code || (error as NodeJS.ErrnoException).code === code);
}

export default class FingerprintQueue {
  public handler: Fingerprinter;
  private queue: QueueObject<string>;
  private pending = new Set<string>();

  constructor(private size = 2, printCanonicalAppMaps = true) {
    // eslint-disable-next-line no-use-before-define
    this.handler = new Fingerprinter(printCanonicalAppMaps);
    this.queue = queue(async (appmapFileName) => {
      try {
        const timeStart = Date.now();
        await this.handler.fingerprint(appmapFileName);
        const timeEnd = Date.now();
        const timeDiff = timeEnd - timeStart;
        console.debug("queue processed     " + appmapFileName + " in " + timeDiff);
      } catch (e) {
        console.warn(`Error fingerprinting ${appmapFileName}: ${e}`);
      }
      this.pending.delete(appmapFileName);
      console.debug("num in pending " + this.pending.size);
      console.debug("num in queue   " + this.queue.length());
    }, this.size);
    this.queue.pause();
  }

  async process() {
    return new Promise<void>((resolve, reject) => {
      this.queue.drain(resolve);
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
        } else reject(error);
      });
      this.queue.resume();
    });
  }

  push(job: string) {
    if (this.pending.has(job)) return;
    this.pending.add(job);
    this.queue.push(job);
  }
}
