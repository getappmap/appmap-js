import { type Dirent, type Stats } from 'node:fs';
import * as fs from 'node:fs/promises';

import { isBinaryFile } from '@appland/search';

import Location from '../../../../src/rpc/explain/location';
import ContentRestrictions from '../../../../src/rpc/explain/ContentRestrictions';
import collectLocationContext, {
  listDirectory,
} from '../../../../src/rpc/explain/collect-location-context';

jest.mock('node:fs/promises');
jest.mock('@appland/search');

describe('collectLocationContext', () => {
  const sourceDirectories = ['/src', '/lib'];

  afterEach(() => {
    jest.resetAllMocks();
    ContentRestrictions.instance.reset();
  });

  describe('listDirectory', () => {
    const mockReaddir = jest.spyOn(fs, 'readdir');

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('lists files and directories up to the specified depth', async () => {
      mockReaddir.mockResolvedValueOnce([mockDirent('file1.js'), mockDirent('dir1', true)]);
      mockReaddir.mockResolvedValueOnce([mockDirent('file2.js'), mockDirent('file3.js')]);

      const result: string[] = [];
      for await (const entry of listDirectory('/test', 1)) {
        result.push(entry);
      }

      expect(result).toEqual(['file1.js', 'dir1/', '\tfile2.js', '\tfile3.js']);
    });

    it('limits the number of subentries', async () => {
      const subentries = Array.from({ length: 101 }, (_, i) => mockDirent(`file${i}.js`));
      mockReaddir.mockResolvedValueOnce([mockDirent('dir1', true)]);
      mockReaddir.mockResolvedValueOnce(subentries);

      const result: string[] = [];
      for await (const entry of listDirectory('/test', 1)) {
        result.push(entry);
      }

      expect(result).toEqual(['dir1/ (101 entries)']);
    });
  });

  describe('with empty locations', () => {
    it('handles empty locations', async () => {
      const result = await collectLocationContext(sourceDirectories, []);
      expect(result).toEqual([]);
    });
  });

  describe('with valid locations', () => {
    const locations = ['file1.js:1-1', '/src/file2.js', '/other/file3.js'];
    const explicitFiles = ['/other/file3.js'];

    const collect = async () =>
      collectLocationContext(sourceDirectories, locations.map(Location.parse), explicitFiles);

    const stat = jest.mocked(fs.stat);
    beforeEach(() => {
      stat.mockResolvedValue({ isDirectory: () => false, isFile: () => true } as Stats);
      jest.spyOn(fs, 'readFile').mockResolvedValue('file contents');
    });

    it('includes explicitly named files even if outside source directories', async () => {
      jest.mocked(isBinaryFile).mockReturnValue(false);

      expect(await collect()).toMatchInlineSnapshot(`
        [
          {
            "content": "file contents",
            "directory": "/src",
            "location": "file1.js:1-1",
            "type": "code-snippet",
          },
          {
            "content": "file contents",
            "directory": "/lib",
            "location": "file1.js:1-1",
            "type": "code-snippet",
          },
          {
            "content": "file contents",
            "directory": "/src",
            "location": "file2.js",
            "type": "code-snippet",
          },
          {
            "content": "file contents",
            "directory": "/other",
            "location": "file3.js",
            "type": "code-snippet",
          },
        ]
      `);

      expect(stat.mock.calls).toStrictEqual([
        ['/src/file1.js'],
        ['/lib/file1.js'],
        ['/src/file2.js'],
        ['/other/file3.js'],
      ]);
    });

    it('should skip restricted locations', async () => {
      ContentRestrictions.instance.setGlobalRestrictions(['file2.js']);
      expect(await collect()).toMatchInlineSnapshot(`
        [
          {
            "content": "file contents",
            "directory": "/src",
            "location": "file1.js:1-1",
            "type": "code-snippet",
          },
          {
            "content": "file contents",
            "directory": "/lib",
            "location": "file1.js:1-1",
            "type": "code-snippet",
          },
          {
            "content": "[file content access denied by security policy]",
            "directory": "/src",
            "location": "file2.js",
            "type": "code-snippet",
          },
          {
            "content": "file contents",
            "directory": "/other",
            "location": "file3.js",
            "type": "code-snippet",
          },
        ]
      `);
    });

    it('excludes non-explicitly named files outside source directories', async () => {
      const nonExplicitLocations = ['file1.js:1-1', '/src/file2.js', '/other/file4.js'].map(
        Location.parse
      );
      const collectNonExplicit = async () =>
        collectLocationContext(sourceDirectories, nonExplicitLocations, explicitFiles);

      jest.mocked(isBinaryFile).mockReturnValue(false);

      expect(await collectNonExplicit()).toMatchInlineSnapshot(`
        [
          {
            "content": "file contents",
            "directory": "/src",
            "location": "file1.js:1-1",
            "type": "code-snippet",
          },
          {
            "content": "file contents",
            "directory": "/lib",
            "location": "file1.js:1-1",
            "type": "code-snippet",
          },
          {
            "content": "file contents",
            "directory": "/src",
            "location": "file2.js",
            "type": "code-snippet",
          },
        ]
      `);

      expect(stat.mock.calls).toStrictEqual([
        ['/src/file1.js'],
        ['/lib/file1.js'],
        ['/src/file2.js'],
      ]);
    });

    it('handles directory listings', async () => {
      stat.mockResolvedValue({ isDirectory: () => true, isFile: () => false } as Stats);
      jest
        .spyOn(fs, 'readdir')
        .mockResolvedValue(['file1.js', 'file2.js'].map((p) => mockDirent(p)));

      const result = await collectLocationContext(sourceDirectories, [Location.parse('/src:0')]);
      expect(result).toEqual([
        {
          type: 'directory-listing',
          content: 'file1.js\nfile2.js',
          location: ':0',
          directory: '/src',
        },
      ]);
    });

    it('skips binary files', async () => {
      jest.mocked(isBinaryFile).mockReturnValue(true);

      const result = await collect();
      expect(result).toEqual([]);
    });

    it('handles non-file locations', async () => {
      stat.mockResolvedValue({ isDirectory: () => false, isFile: () => false } as Stats);
      const result = await collect();
      expect(result).toEqual([]);
    });

    it('handles non-existent files', async () => {
      stat.mockRejectedValue(new Error('Not found'));
      const result = await collect();
      expect(result).toEqual([]);
    });

    it('handles file reading errors', async () => {
      jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('Read error'));

      const result = await collect();
      expect(result).toEqual([]);
    });

    it('extracts snippets correctly', async () => {
      jest.spyOn(fs, 'readFile').mockResolvedValue('file conte\nnts');

      const result = await collect();
      expect(result[0].content).toBe('file conte');
    });

    it('handles large files by setting line range', async () => {
      const largeContent = 'aaa\n'.repeat(6_000);
      jest.spyOn(fs, 'readFile').mockResolvedValue(largeContent);

      // note the limit currently only applies to unbounded requests
      const [, , result] = await collect();
      expect(result.content.length).toBeLessThanOrEqual(20_000);
    });
  });
});

function mockDirent(name: string, isDirectory = false): Dirent {
  return {
    name,
    isFile: () => true,
    isDirectory: () => isDirectory,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
  };
}
