import { open, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFileAtomic } from '../../src/utils';

function randFilename(len: number): string {
  return Math.random().toString(36).padEnd(len, '-');
}

async function tryFilename(name: string): Promise<void> {
  const path = join(tmpdir(), name);
  const file = await open(path, 'w');
  await file.close();
  await rm(path);
}

describe(writeFileAtomic, () => {
  it('works correctly even if target file is at maximum name length already', async () => {
    const MAXLEN = 255;

    // verify first if the max len is indeed what we think
    await expect(tryFilename(randFilename(MAXLEN))).resolves.not.toThrow();
    await expect(tryFilename(randFilename(MAXLEN + 1))).rejects.toThrow(/ENAMETOOLONG/);

    const filename = randFilename(MAXLEN);
    await expect(writeFileAtomic(tmpdir(), filename, 'test', 'test')).resolves.not.toThrow();
    await rm(join(tmpdir(), filename));
  });

  it('works correctly even if jobId is a number', async () => {
    const filenames = [randFilename(32), randFilename(32)];
    const promises = Promise.all(
      filenames.map((name) => writeFileAtomic(tmpdir(), name, '31337', 'test'))
    );

    await expect(promises).resolves.not.toThrow();
    await Promise.all(filenames.map((name) => rm(join(tmpdir(), name))));
  });
});
