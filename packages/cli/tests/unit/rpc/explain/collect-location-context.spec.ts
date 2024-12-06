import * as fs from 'fs/promises';
import * as utils from '../../../../src/utils';

import Location from '../../../../src/rpc/explain/location';
import collectLocationContext from '../../../../src/rpc/explain/collect-location-context';

jest.mock('fs/promises');
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('../../../../src/utils', () => ({
  ...jest.requireActual('../../../../src/utils'),
  exists: jest.fn(),
  isFile: jest.fn(),
}));

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
    const locations: Location[] = [
      { path: 'file1.js', snippet: (contents: string) => contents.slice(0, 10) },
      { path: '/src/file2.js', snippet: (contents: string) => contents.slice(0, 10) },
      { path: '/other/file3.js', snippet: (contents: string) => contents.slice(0, 10) }, // This should be skipped
    ];

    const collect = async () => collectLocationContext(sourceDirectories, locations);

    it('handles valid locations and skips those outside source directories', async () => {
      jest.spyOn(utils, 'exists').mockResolvedValue(true);
      jest.spyOn(utils, 'isFile').mockResolvedValue(true);
      jest.spyOn(fs, 'readFile').mockResolvedValue('file contents');

      const result = await collect();
      expect(result.length).toBe(3);
      expect(result[0].content).toBe('file conte');
      expect(result[1].content).toBe('file conte');
      expect(result[2].content).toBe('file conte');

      expect(utils.exists).toHaveBeenCalledTimes(3);
      expect(utils.exists).toHaveBeenCalledWith('/src/file1.js');
      expect(utils.exists).toHaveBeenCalledWith('/lib/file1.js');
      expect(utils.exists).toHaveBeenCalledWith('/src/file2.js');
      // note file in /other is skipped
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
      jest.spyOn(fs, 'readFile').mockResolvedValue('file contents');

      const result = await collect();
      expect(result[0].content).toBe('file conte');
    });
  });
});
