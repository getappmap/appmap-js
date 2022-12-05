import { queue, QueueObject } from 'async';
import FileTooLargeError from './fileTooLargeError';
import Fingerprinter from './fingerprinter';

function isNodeError(error: unknown, code?: string): error is NodeJS.ErrnoException {
  return error instanceof Error && (!code || (error as NodeJS.ErrnoException).code === code);
}

export default class FingerprintQueue {
  public handler: Fingerprinter;
  private queue: QueueObject<string>;

  constructor(private size = 1, printCanonicalAppMaps = true) {
    // eslint-disable-next-line no-use-before-define
    this.handler = new Fingerprinter(printCanonicalAppMaps);
    this.queue = queue(async (appmapFileName) => {
      try {
        //console.debug("did  push to queue  " + job);
        console.debug("queue processing    " + appmapFileName);
        await this.handler.fingerprint(appmapFileName);
        //this.handler.fingerprint(appmapFileName);
      } catch (e) {
        console.warn(`Error fingerprinting ${appmapFileName}: ${e}`);
      }
    }, this.size);
    console.debug("will pause the queue");
    this.queue.pause();
    console.debug("did  pause the queue");
  }

  async process() {
    return new Promise<void>((resolve, reject) => {
      console.debug("will drain the queue");
      this.queue.drain(resolve);
      console.debug("did  drain the queue");
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
      console.debug("will resume the queue");
      this.queue.resume();
      console.debug("did  resume the queue");
    });
  }

  push(job: string) {
    console.debug("num in queue        " + this.queue.length());
    console.debug("push IN for         " + job);
    //console.debug("will push to queue  " + job);
    this.queue.push(job);
    //console.debug("did  push to queue  " + job);
    console.debug("push OUT from end   " + job);
  }

  remove(job: string) {
    console.debug("remove IN  for " + job);
    this.queue.remove((node) => node.data.includes(job));
    console.debug("remove OUT rmd " + job);
    console.debug("remove OUT for " + job);
  }
}
