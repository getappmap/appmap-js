import { type Dirent, type Stats } from 'node:fs';
import * as fs from 'node:fs/promises';

import { isBinaryFile } from '@appland/search';

import Location from '../../../../src/rpc/explain/location';
import collectLocationContext from '../../../../src/rpc/explain/collect-location-context';

jest.mock('node:fs/promises');
jest.mock('@appland/search');

describe('collectLocationContext', () => {
  const sourceDirectories = ['/src', '/lib'];

  afterEach(jest.resetAllMocks);

  describe('with empty locations', () => {
    it('handles empty locations', async () => {
      const result = await collectLocationContext(sourceDirectories, []);
      expect(result).toEqual([]);
    });
  });

  describe('with valid locations', () => {
    const locations = ['file1.js:1-1', '/src/file2.js', '/other/file3.js'].map(Location.parse);

    const collect = async () => collectLocationContext(sourceDirectories, locations);

    const stat = jest.mocked(fs.stat);
    beforeEach(() => {
      stat.mockResolvedValue({ isDirectory: () => false, isFile: () => true } as Stats);
      jest.spyOn(fs, 'readFile').mockResolvedValue('file contents');
    });

    it('handles valid locations and skips those outside source directories', async () => {
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
        ]
      `);

      expect(stat.mock.calls).toStrictEqual([
        ['/src/file1.js'],
        ['/lib/file1.js'],
        ['/src/file2.js'],
      ]);
      // note file in /other is skipped
    });

    it('handles directory listings', async () => {
      stat.mockResolvedValue({ isDirectory: () => true, isFile: () => false } as Stats);
      jest.spyOn(fs, 'readdir').mockResolvedValue(['file1.js', 'file2.js'].map(mockDirent));

      const result = await collectLocationContext(sourceDirectories, [Location.parse('/src:0')]);
      expect(result).toEqual([
        {
          type: 'directory-listing',
          content: 'file1.js\nfile2.js',
          location: '.:0',
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

function mockDirent(name: string): Dirent {
  return {
    name,
    isFile: () => true,
    isDirectory: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
  };
}
