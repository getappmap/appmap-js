// This function is used for a "one-shot" search in which the index us built, used, and discarded.
// Replace this with a persistent index file that can be used across multiple searches, and is

import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export interface Closeable {
  close(): void;
}

// synced with the file system as needed.
export default async function withIndex<T extends Closeable, S>(
  indexName: string,
  builder: (indexFile: string) => Promise<T>,
  callback: (index: T) => S | Promise<S>
): Promise<S> {
  const tmpDir = await mkdtemp(join(tmpdir(), `appmap-${indexName}-${new Date().getTime()}`));
  const indexFile = join(tmpDir, 'index.sqlite');

  const close = (index: T) => {
    try {
      index.close();
    } catch (err) {
      console.error(err);
    }
  };
  const cleanupDir = async () =>
    await rm(tmpDir, { recursive: true }).catch((err) => console.error(err));

  let index: T | undefined;
  try {
    index = await builder(indexFile);
    return await callback(index);
  } finally {
    if (index) close(index);
    await cleanupDir();
  }
}
