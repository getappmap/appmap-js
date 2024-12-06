import * as fs from 'fs/promises';
import * as utils from '../../../../src/utils';
import { isBinaryFile } from '@appland/search';

import Location from '../../../../src/rpc/explain/location';
import collectLocationContext from '../../../../src/rpc/explain/collect-location-context';

jest.mock('fs/promises');
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('../../../../src/utils', () => ({
  ...jest.requireActual('../../../../src/utils'),
  exists: jest.fn(),
  isFile: jest.fn(),
}));

jest.mock('@appland/search');

describe('collectLocationContext', () => {
  const sourceDirectories = ['/src', '/lib'];

  beforeEach(() => jest.resetAllMocks());

  describe('with empty locations', () => {
    it('handles empty locations', async () => {
      const result = await collectLocationContext(sourceDirectories, []);
      expect(result).toEqual([]);
    });
  });

  describe('with valid locations', () => {
    const locations = ['file1.js:1-1', '/src/file2.js', '/other/file3.js'].map(Location.parse);

    const collect = async () => collectLocationContext(sourceDirectories, locations);

    it('handles valid locations and skips those outside source directories', async () => {
      jest.spyOn(utils, 'exists').mockResolvedValue(true);
      jest.spyOn(utils, 'isFile').mockResolvedValue(true);
      jest.spyOn(fs, 'readFile').mockResolvedValue('file contents');
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

      expect(utils.exists).toHaveBeenCalledTimes(3);
      expect(utils.exists).toHaveBeenCalledWith('/src/file1.js');
      expect(utils.exists).toHaveBeenCalledWith('/lib/file1.js');
      expect(utils.exists).toHaveBeenCalledWith('/src/file2.js');
      // note file in /other is skipped
    });

    it('skips binary files', async () => {
      jest.spyOn(utils, 'exists').mockResolvedValue(true);
      jest.spyOn(utils, 'isFile').mockResolvedValue(true);
      jest.mocked(isBinaryFile).mockReturnValue(true);

      const result = await collect();
      expect(result).toEqual([]);
    });

    it('handles non-file locations', async () => {
      jest.spyOn(utils, 'exists').mockResolvedValue(true);
      jest.spyOn(utils, 'isFile').mockResolvedValue(false);

      const result = await collect();
      expect(result).toEqual([]);
    });

    it('handles non-existent files', async () => {
      jest.spyOn(utils, 'exists').mockResolvedValue(false);

      const result = await collect();
      expect(result).toEqual([]);
    });

    it('handles file reading errors', async () => {
      jest.spyOn(utils, 'exists').mockResolvedValue(true);
      jest.spyOn(utils, 'isFile').mockResolvedValue(true);
      jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('Read error'));

      const result = await collect();
      expect(result).toEqual([]);
    });

    it('extracts snippets correctly', async () => {
      jest.spyOn(utils, 'exists').mockResolvedValue(true);
      jest.spyOn(utils, 'isFile').mockResolvedValue(true);
      jest.spyOn(fs, 'readFile').mockResolvedValue('file conte\nnts');

      const result = await collect();
      expect(result[0].content).toBe('file conte');
    });
  });
});
