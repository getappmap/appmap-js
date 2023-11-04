import { open, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { dirSync as makeTempDir } from 'tmp-promise';

import { processNamedFiles, writeFileAtomic } from '../../src/utils';
import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import assert from 'node:assert';

describe(processNamedFiles, () => {
  it('enumerates named files', async () => {
    expect.assertions(1);

    const tmp = makeTempDir({ unsafeCleanup: true }).name;
    touch(tmp, 'bar');
    touch(tmp, 'foo', 'bar');
    touch(tmp, 'other', 'foo');
    touch(tmp, 'other', 'bar');
    touch(tmp, 'other', 'sub', 'foo');
    touch(tmp, 'outer', 'foo');

    const results: string[] = [];

    await processNamedFiles(tmp, 'foo', async (path) => results.push(path));

    results.sort();

    expect(results).toEqual([join(tmp, 'other', 'foo'), join(tmp, 'outer', 'foo')]);
  });

  if (process.platform !== 'win32')
    it('does not follow filesystem loops', async () => {
      expect.assertions(1);

      const tmp = makeTempDir({ unsafeCleanup: true }).name;
      mkdirSync(join(tmp, 'a', 'b', 'c', 'd', 'e', 'f'), { recursive: true });
      touch(tmp, 'a', 'b', 'c', 'bar', 'foo');
      mkdirSync(join(tmp, 'g', 'h', 'i', 'j', 'k', 'l'), { recursive: true });

      symlinkSync('../../../../../../a', join(tmp, 'g', 'h', 'i', 'j', 'k', 'l', 'a'));
      symlinkSync('../../../../../../g', join(tmp, 'a', 'b', 'c', 'd', 'e', 'f', 'g'));

      const results: string[] = [];

      await processNamedFiles(tmp, 'foo', async (path) => results.push(path));

      expect(results).toEqual([join(tmp, 'a', 'b', 'c', 'bar', 'foo')]);
    });
});

describe(writeFileAtomic, () => {
  it('works correctly even if target file is at maximum name length already', async () => {
    const MAXLEN = 255;

    // on Windows, an ENOENT error is thrown
    const errorType = process.platform === 'win32' ? /ENOENT/ : /ENAMETOOLONG/;

    // verify first if the max len is indeed what we think
    await expect(tryFilename(randFilename(MAXLEN))).resolves.not.toThrow();
    await expect(tryFilename(randFilename(MAXLEN + 1))).rejects.toThrow(errorType);

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

function randFilename(len: number): string {
  return Math.random().toString(36).padEnd(len, '-');
}

async function tryFilename(name: string): Promise<void> {
  const path = join(tmpdir(), name);
  const file = await open(path, 'w');
  await file.close();
  await rm(path);
}

function touch(...path: string[]) {
  const filename = path.pop();
  assert(filename);
  mkdirSync(join(...path), { recursive: true });
  writeFileSync(join(...path, filename), '');
}
