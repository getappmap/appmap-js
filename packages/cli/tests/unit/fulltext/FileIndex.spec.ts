import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import { join } from 'node:path';

import sqlite3 from 'better-sqlite3';
import tmp from 'tmp';

import { FileIndex, filterFiles, getGitAttributes } from '../../../src/fulltext/FileIndex';
import * as querySymbols from '../../../src/fulltext/querySymbols';
import { Git, GitState } from '../../../src/telemetry';
import * as listGitProjectFiles from '../../../src/fulltext/listGitProjectFIles';

const originalFsStat: typeof fs = jest.requireActual('node:fs/promises');
jest.mock('node:fs/promises');

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

  beforeEach(() => {
    database = new sqlite3(':memory:');
    jest.mocked(fs.stat).mockReset();
  });

  describe('when matches are found', () => {
    beforeEach(() => {
      fileIndex = new FileIndex(database);
      files.forEach(({ directory, fileName }) => fileIndex.indexFile(directory, fileName));
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

  describe('indexFile', () => {
    it('does not query symbols if allowSymbols is false', () => {
      const querySymbolsFn = jest.spyOn(querySymbols, 'default');
      const fileIndex = new FileIndex(database);
      fileIndex.indexFile('dir1', 'file1', { allowSymbols: false });
      expect(querySymbolsFn).not.toHaveBeenCalled();
    });
  });

  describe('indexDirectories', () => {
    const numFiles = 100;
    const batchSize = 50;
    const fileNames = Array.from({ length: numFiles }, (_, i) => `file${i}`);

    let fileIndex: FileIndex;
    let indexFile: jest.SpyInstance;
    let indexDirectory: jest.SpyInstance;

    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
    // `any` is used to avoid type errors and provide access to private methods

    beforeEach(() => {
      fileIndex = new FileIndex(database);
      indexFile = jest.spyOn(fileIndex, 'indexFile');
      indexDirectory = jest.spyOn(fileIndex as any, 'indexDirectory');

      jest.spyOn(Git, 'state').mockResolvedValue(GitState.Ok);
      jest.mocked(fs.stat).mockResolvedValue({
        isFile: jest.fn().mockReturnValue(true),
        size: BigInt(100),
      } as any);
      jest.spyOn(listGitProjectFiles, 'default').mockResolvedValue(fileNames);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('indexes all files in batches', async () => {
      await fileIndex.indexDirectories(['dir1'], undefined, undefined, batchSize);

      expect(indexDirectory).toHaveBeenCalledTimes(numFiles / batchSize);
      expect(indexFile).toHaveBeenCalledTimes(numFiles);
      expect(indexFile.mock.calls.map(([, fileName]) => fileName)).toEqual(fileNames);
    });

    describe('when some are filtered out', () => {
      describe('by excludePattern', () => {
        it('removes them', async () => {
          await fileIndex.indexDirectories(['dir1'], [/file1/], undefined);

          expect(fileIndex.search(['file1'], 10)).toHaveLength(0);
          expect(fileIndex.search(['file2'], 10)).toHaveLength(1);
        });
      });

      describe('by includePattern', () => {
        it('removes them', async () => {
          await fileIndex.indexDirectories(['dir1'], undefined, [/file1/]);

          expect(fileIndex.search(['file1'], 10)).toHaveLength(1);
          expect(fileIndex.search(['file2'], 10)).toHaveLength(0);
        });
      });
    });

    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
  });
});

describe(filterFiles, () => {
  beforeEach(() => {
    fs.stat = originalFsStat.stat;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('filters out binary files, non-files, and large data files', async () => {
    const dir = tmp.dirSync({ unsafeCleanup: true }).name;
    writeFileSync(join(dir, 'file.txt'), 'hello');
    writeFileSync(join(dir, 'file.zip'), 'hello');
    writeFileSync(join(dir, 'file.json'), 'hello');
    writeFileSync(join(dir, 'large.txt'), Buffer.alloc(100_000));
    writeFileSync(join(dir, 'large.js'), Buffer.alloc(100_000));
    writeFileSync(join(dir, 'large.ts'), Buffer.alloc(100_000));
    writeFileSync(join(dir, 'large.haml'), Buffer.alloc(100_000));
    writeFileSync(join(dir, 'large.java'), Buffer.alloc(100_000));
    writeFileSync(join(dir, 'large.mjs'), Buffer.alloc(100_000));
    writeFileSync(join(dir, 'large.pyc'), Buffer.alloc(100_000));
    writeFileSync(join(dir, 'large.json'), Buffer.alloc(100_000));
    mkdirSync(join(dir, 'dir'));

    const fileList = readdirSync(dir);
    const filtered = await filterFiles(dir, fileList);
    expect(filtered).toEqual([
      'file.json',
      'file.txt',
      'large.haml',
      'large.java',
      'large.js',
      'large.mjs',
      'large.ts',
      'large.txt',
    ]);
  });

  it('filters out files based on git attributes', async () => {
    const dir = tmp.dirSync({ unsafeCleanup: true }).name;
    writeFileSync(join(dir, '.gitattributes'), '*.my-extension binary\n*.bin binary\n*.txt text\n');
    writeFileSync(join(dir, 'file.txt'), 'hello');
    writeFileSync(join(dir, 'file.my-extension'), 'hello');
    writeFileSync(join(dir, 'file.bin'), 'hello');
    writeFileSync(join(dir, '.file.bin'), 'hello');

    const fileList = readdirSync(dir);
    const gitAttributes = getGitAttributes(dir);
    const filtered = await filterFiles(dir, fileList, undefined, undefined, gitAttributes);
    expect(filtered).toEqual(['.gitattributes', 'file.txt']);
  });
});

describe('getGitAttributes', () => {
  it('returns an empty array if the .gitattributes file does not exist', () => {
    const dir = tmp.dirSync({ unsafeCleanup: true }).name;
    expect(getGitAttributes(dir)).toEqual([]);
  });

  it('returns an empty array if the .gitattributes file is empty', () => {
    const dir = tmp.dirSync({ unsafeCleanup: true }).name;
    writeFileSync(join(dir, '.gitattributes'), '');
    expect(getGitAttributes(dir)).toEqual([]);
  });

  it('returns an expected result if an item is invalid', () => {
    const dir = tmp.dirSync({ unsafeCleanup: true }).name;
    writeFileSync(join(dir, '.gitattributes'), 'invalid');
    expect(getGitAttributes(dir)).toEqual([
      {
        pattern: 'invalid',
        binary: false,
      },
    ]);
  });

  it('returns an array of attributes if the .gitattributes file is valid', () => {
    const dir = tmp.dirSync({ unsafeCleanup: true }).name;
    writeFileSync(join(dir, '.gitattributes'), '*.txt text\n*.bin binary\n');
    expect(getGitAttributes(dir)).toEqual([
      { pattern: '*.txt', binary: false },
      { pattern: '*.bin', binary: true },
    ]);
  });
});
