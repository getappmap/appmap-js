import * as utils from '../../../src/utils';
import UpToDate from '../../../src/lib/UpToDate';
import { PathLike } from 'fs';
import { join } from 'path';
import { FileIndex, FileSearchResult } from '@appland/search';
import { search } from '../../../src/fulltext/appmap-index';
import { SearchStats } from '../../../src/fulltext/appmap-match';

jest.mock('../../../src/utils');
jest.mock('../../../src/lib/UpToDate');

describe('AppMapIndex', () => {
  let mockAppmapIndex: FileIndex;

  afterEach(() => jest.resetAllMocks());

  function mockUpToDate() {
    const upToDate = jest.mocked(UpToDate);
    upToDate.prototype.isOutOfDate.mockResolvedValue(undefined);
  }

  describe('when search results are found', () => {
    beforeEach(() => {
      const searchResults: FileSearchResult[] = [
        {
          directory: 'the-dir',
          filePath: 'appmap5',
          score: 5,
        },
        {
          directory: 'the-dir',
          filePath: 'appmap4',
          score: 4,
        },
        {
          directory: 'the-dir',
          filePath: 'appmap3',
          score: 3,
        },
        {
          directory: 'the-dir',
          filePath: 'appmap2',
          score: 2,
        },
        {
          directory: 'the-dir',
          filePath: 'appmap1',
          score: 1,
        },
      ];
      const search = jest.fn().mockReturnValue(searchResults);
      const exists = jest.mocked(utils).exists;
      exists.mockResolvedValue(true);

      mockAppmapIndex = {
        search,
      } as unknown as FileIndex;
    });

    describe('and some are out of date', () => {
      let upToDate: jest.MockedObjectDeep<typeof UpToDate>;

      beforeEach(() => {
        upToDate = jest.mocked(UpToDate);
        upToDate.prototype.isOutOfDate.mockImplementation(async (appmapName: string) => {
          return appmapName === 'appmap4' ? new Set(['file4.rb']) : undefined;
        });
      });

      it('downscores the out of date matches', async () => {
        const searchResults = await search(mockAppmapIndex, 'login', 5);
        expect(searchResults.numResults).toEqual(5);
        expect(searchResults.results.map((r) => r.appmap)).toEqual([
          'appmap5',
          'appmap3',
          'appmap4',
          'appmap2',
          'appmap1',
        ]);
        expect(searchResults.results[2].score).toBeCloseTo(2.341);
        expect(upToDate.prototype.isOutOfDate).toHaveBeenCalledTimes(5);
      });

      it('only computes downscore until maxResults is reached', async () => {
        const searchResults = await search(mockAppmapIndex, 'login', 1);
        expect(searchResults.numResults).toEqual(5);
        expect(searchResults.results.map((r) => r.appmap)).toEqual(['appmap5']);
        expect(searchResults.results.map((r) => r.score)).toEqual([5]);
        expect(upToDate.prototype.isOutOfDate).toHaveBeenCalledTimes(1);
      });
    });

    it(`reports statistics`, async () => {
      mockUpToDate();

      const searchResults = await search(mockAppmapIndex, 'login', 10);
      expect(searchResults.numResults).toEqual(5);
      expect(searchResults.results.map((r) => r.score)).toEqual([5, 4, 3, 2, 1]);

      const stats: SearchStats = { ...searchResults.stats };
      const stddev = stats.stddev;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      delete (stats as any).stddev;
      expect(stats).toEqual({
        max: 5,
        median: 3,
        mean: 3,
      });
      expect(stddev).toBeCloseTo(3.3166);
    });
  });

  describe('when search results are not found', () => {
    it('returns an expected result', async () => {
      mockAppmapIndex = {
        search: jest.fn().mockReturnValue([]),
      } as unknown as FileIndex;
      const searchResults = await search(mockAppmapIndex, 'the search', 10);
      expect(searchResults).toStrictEqual({
        type: 'appmap',
        results: [],
        stats: {},
        numResults: 0,
      });
    });
  });

  describe(`when a search result doesn't exist on disk`, () => {
    beforeEach(() => {
      const existingFileNames = [join('appmap1.appmap.json')];
      const exists = jest.mocked(utils).exists;
      exists.mockImplementation(async (appmapFileName: PathLike): Promise<boolean> => {
        return Promise.resolve(existingFileNames.includes(appmapFileName.toString()));
      });

      const searchResults: FileSearchResult[] = [
        {
          directory: 'the-dir',
          filePath: 'appmap1',
          score: 1,
        },
        {
          directory: 'the-dir',
          filePath: 'appmap2',
          score: 2,
        },
      ];
      mockAppmapIndex = {
        search: jest.fn().mockReturnValue(searchResults),
      } as unknown as FileIndex;
    });

    beforeEach(() => mockUpToDate());

    it(`removes the search result from the reported matches`, async () => {
      const searchResults = await search(mockAppmapIndex, 'login', 10);
      expect(searchResults.numResults).toEqual(1);
      expect(searchResults.results).toEqual([
        { appmap: 'appmap1', directory: 'the-dir', score: 1 },
      ]);
    });
  });
});
