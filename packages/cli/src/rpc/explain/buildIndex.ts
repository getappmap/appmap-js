// This function is used for a "one-shot" search in which the index us built, used, and discarded.
// Replace this with a persistent index file that can be used across multiple searches, and is

import { rmSync } from 'fs';
import { mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export interface Closeable {
  close(): void;
}

type CloseableIndex<T> = {
  index: T;
  close: () => void;
};

export default async function buildIndex<T extends Closeable>(
  indexName: string,
  builder: (indexFile: string) => Promise<T>
): Promise<CloseableIndex<T>> {
  const tmpDir = await mkdtemp(join(tmpdir(), `appmap-${indexName}-${new Date().getTime()}`));
  const indexFile = join(tmpDir, 'index.sqlite');

  const index = await builder(indexFile);

  const close = () => {
    try {
      index.close();
    } catch (err) {
      console.error(err);
    }
    try {
      rmSync(tmpDir, { recursive: true });
    } catch (err) {
      console.error(err);
    }
  };

  return {
    index,
    close,
  };
}
