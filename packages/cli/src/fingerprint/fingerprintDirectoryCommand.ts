import type { Metadata } from '@appland/models';
import { findFiles, verbose } from '../utils';
import FingerprintQueue from './fingerprintQueue';
import emitUsage from '../lib/emitUsage';

class FingerprintDirectoryCommand {
  private appmaps: number = 0;
  private events: number = 0;
  private metadata?: Metadata;

  constructor(private readonly directory: string) {}

  async execute() {
    if (verbose()) {
      console.warn(`Fingerprinting appmaps in ${this.directory}`);
    }

    const fpQueue = new FingerprintQueue();
    fpQueue.handler.on('index', ({ numEvents, metadata }) => {
      this.appmaps += 1;
      this.events += numEvents;
      this.metadata = metadata;
    });

    let count = 0;
    await this.files((file) => {
      count += 1;
      return fpQueue.push(file);
    });
    if (count > 0) await fpQueue.process();

    emitUsage(this.directory, this.events, this.appmaps, this.metadata);

    return count;
  }

  async files(fn) {
    return findFiles(this.directory, '.appmap.json', fn);
  }
}

module.exports = FingerprintDirectoryCommand;
