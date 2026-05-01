import type { Metadata } from '@appland/models';
import { findFiles, verbose } from '../utils';
import FingerprintQueue from './fingerprintQueue';
import writeUsage, { collectUsageData } from '../lib/emitUsage';
import type { QueryDbIndexer } from '../cmds/query/db/import/QueryDbIndexer';

class FingerprintDirectoryCommand {
  private appmaps = 0;
  private events = 0;
  private metadata?: Metadata;

  constructor(
    private readonly directory: string,
    private readonly indexer?: QueryDbIndexer
  ) {}

  async execute() {
    if (verbose()) {
      console.warn(`Fingerprinting appmaps in ${this.directory}`);
    }

    const fpQueue = new FingerprintQueue();
    fpQueue.on('index', ({ numEvents, metadata }) => {
      this.appmaps += 1;
      this.events += numEvents;
      this.metadata = metadata;
    });
    if (this.indexer) this.indexer.attach(fpQueue);

    let count = 0;
    await this.files((file) => {
      count += 1;
      return fpQueue.push(file);
    });
    if (count > 0) await fpQueue.process();

    if (this.indexer) await this.indexer.syncDirectory(this.directory);

    const usageData = await collectUsageData(
      this.directory,
      this.events,
      this.appmaps,
      this.metadata
    );
    await writeUsage(usageData, this.directory);

    return count;
  }

  async files(fn) {
    return findFiles(this.directory, '.appmap.json', fn);
  }
}

export default FingerprintDirectoryCommand;
