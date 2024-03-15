import sinon, { SinonSandbox } from 'sinon';
import * as utils from '../../../src/utils';
import AppMapIndex from '../../../src/fulltext/AppMapIndex';
import UpToDate from '../../../src/lib/UpToDate';
import lunr from 'lunr';
import { PathLike } from 'fs';
import { packRef } from '../../../src/fulltext/ref';
import { join } from 'path';

jest.mock('../../../src/utils');
jest.mock('../../../src/lib/UpToDate');

describe('AppMapIndex', () => {
  let appMapIndex: AppMapIndex;

  afterEach(() => jest.resetAllMocks());

  function mockUpToDate() {
    const upToDate = jest.mocked(UpToDate);
    upToDate.prototype.isOutOfDate.mockResolvedValue(undefined);
  }

  describe('when search results are found', () => {
    beforeEach(() => {
      const search = jest.fn().mockReturnValue([
        { ref: packRef('the-dir', 'appmap5'), score: 5 },
        { ref: packRef('the-dir', 'appmap4'), score: 4 },
        { ref: packRef('the-dir', 'appmap3'), score: 3 },
        { ref: packRef('the-dir', 'appmap2'), score: 2 },
        { ref: packRef('the-dir', 'appmap1'), score: 1 },
      ]);
      const exists = jest.mocked(utils).exists;
      exists.mockResolvedValue(true);
      const mockLunr: lunr.Index = {
        search,
      } as unknown as lunr.Index;
      appMapIndex = new AppMapIndex(['project-dir'], mockLunr);
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
        const searchResults = await appMapIndex.search('login');
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
        const searchResults = await appMapIndex.search('login', { maxResults: 1 });
        expect(searchResults.numResults).toEqual(5);
        expect(searchResults.results.map((r) => r.appmap)).toEqual(['appmap5']);
        expect(searchResults.results.map((r) => r.score)).toEqual([5]);
        expect(upToDate.prototype.isOutOfDate).toHaveBeenCalledTimes(1);
      });
    });

    describe('when search results are not found', () => {
      it('returns an expected result', async () => {
        const index = new AppMapIndex(['project-dir'], {
          search: jest.fn().mockReturnValue([]),
        } as any);
        const searchResults = await index.search('');
        expect(searchResults).toStrictEqual({
          type: 'appmap',
          results: [],
          stats: {},
          numResults: 0,
        });
      });
    });

    it(`reports statistics`, async () => {
      mockUpToDate();

      const searchResults = await appMapIndex.search('login');
      expect(searchResults.numResults).toEqual(5);
      expect(searchResults.results.map((r) => r.score)).toEqual([5, 4, 3, 2, 1]);

      const stats: any = { ...searchResults.stats };
      const stddev = stats.stddev;
      delete stats.stddev;
      expect(stats).toEqual({
        max: 5,
        median: 3,
        mean: 3,
      });
      expect(stddev).toBeCloseTo(3.3166);
    });
  });

  describe(`when a search result doesn't exist on disk`, () => {
    beforeEach(() => mockUpToDate());

    it(`removes the search result from the reported matches`, async () => {
      const existingFileNames = [join('the-dir', 'appmap1.appmap.json')];
      const search = jest.fn().mockReturnValue([
        { ref: packRef('the-dir', 'appmap1'), score: 1 },
        { ref: packRef('the-dir', 'appmap2'), score: 2 },
      ]);
      const exists = jest.mocked(utils).exists;
      exists.mockImplementation(async (appmapFileName: PathLike): Promise<boolean> => {
        return Promise.resolve(existingFileNames.includes(appmapFileName.toString()));
      });
      const mockLunr: lunr.Index = {
        search,
      } as unknown as lunr.Index;
      appMapIndex = new AppMapIndex(['project-dir'], mockLunr);

      const searchResults = await appMapIndex.search('login');
      expect(searchResults.numResults).toEqual(1);
      expect(searchResults.results).toEqual([
        { appmap: 'appmap1', directory: 'the-dir', score: 1 },
      ]);
    });
  });
});
