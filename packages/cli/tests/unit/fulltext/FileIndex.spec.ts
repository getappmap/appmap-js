import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import sqlite3 from 'better-sqlite3';
import tmp from 'tmp';

import { FileIndex, filterFiles } from '../../../src/fulltext/FileIndex';

describe('FileIndex', () => {
  let fileIndex: FileIndex;
  let database: sqlite3.Database;
  const files: { directory: string; fileName: string }[] = [
    {
      directory: 'dir1',
      fileName: 'filea',
    },
    {
      directory: 'dir1',
      fileName: 'file11',
    },
    {
      directory: 'dir1',
      fileName: 'file12',
    },
    {
      directory: 'dir2',
      fileName: 'filea',
    },
    {
      directory: 'dir2',
      fileName: 'file21',
    },
    {
      directory: 'dir2',
      fileName: 'file22',
    },
  ];

  beforeEach(() => (database = new sqlite3(':memory:')));

  describe('when matches are found', () => {
    beforeEach(() => {
      fileIndex = new FileIndex(database);
      for (const file of files) {
        fileIndex.indexFile(file.directory, file.fileName);
      }
    });
    afterEach(() => fileIndex.close());

    it('returns matching file names', () => {
      const results = fileIndex.search(['filea'], 10);
      expect(results.map((r) => ({ directory: r.directory, fileName: r.fileName }))).toEqual([
        { directory: 'dir1', fileName: 'filea' },
        { directory: 'dir2', fileName: 'filea' },
      ]);
    });

    it('matches alphanumeric file names', () => {
      const results = fileIndex.search(['file11'], 10);
      expect(results.map((r) => ({ directory: r.directory, fileName: r.fileName }))).toEqual([
        { directory: 'dir1', fileName: 'file11' },
      ]);
    });

    it('does not match directory nanmes', () => {
      const results = fileIndex.search(['dir1'], 10);
      expect(results.map((r) => ({ directory: r.directory, fileName: r.fileName }))).toEqual([]);
    });
  });
});

describe(filterFiles, () => {
  it('filters out files with binary extensions, files over 50 kB and non-files', async () => {
    const dir = tmp.dirSync({ unsafeCleanup: true }).name;
    writeFileSync(join(dir, 'file.txt'), 'hello');
    writeFileSync(join(dir, 'file.zip'), 'hello');
    writeFileSync(join(dir, 'file.json'), 'hello');
    writeFileSync(join(dir, 'large.txt'), Buffer.alloc(100_000));
    mkdirSync(join(dir, 'dir'));

    const fileList = readdirSync(dir);
    const filtered = await filterFiles(dir, fileList);
    expect(filtered).toEqual(['file.json', 'file.txt']);
  });
});
