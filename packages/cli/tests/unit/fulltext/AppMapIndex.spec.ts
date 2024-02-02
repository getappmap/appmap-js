import sinon, { SinonSandbox } from 'sinon';
jest.mock('../../../src/utils');
import * as utils from '../../../src/utils';
import AppMapIndex from '../../../src/fulltext/AppMapIndex';
import lunr from 'lunr';
import { PathLike } from 'fs';

describe('AppMapIndex', () => {
  let sandbox: SinonSandbox;
  let appMapIndex: AppMapIndex;

  beforeEach(() => (sandbox = sinon.createSandbox()));
  afterEach(() => sandbox.restore());

  it(`Reports statistics about the search results`, async () => {
    const search = jest.fn().mockReturnValue([
      { ref: 'appmap1', score: 1 },
      { ref: 'appmap2', score: 2 },
      { ref: 'appmap3', score: 3 },
      { ref: 'appmap4', score: 4 },
      { ref: 'appmap5', score: 5 },
    ]);
    const exists = jest.mocked(utils).exists;
    exists.mockResolvedValue(true);
    const mockLunr: lunr.Index = {
      search,
    } as unknown as lunr.Index;
    appMapIndex = new AppMapIndex(
      'appmapDir',
      'mock appmaps list' as unknown as Map<string, number>,
      mockLunr
    );

    const searchResults = await appMapIndex.search('login');
    expect(searchResults.numResults).toEqual(5);
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

  describe(`when a search result doesn't exist on disk`, () => {
    it(`removes the search result from the reported matches`, async () => {
      const existingFileNames = ['appmap1.appmap.json'];
      const search = jest.fn().mockReturnValue([
        { ref: 'appmap1', score: 1 },
        { ref: 'appmap2', score: 2 },
      ]);
      const exists = jest.mocked(utils).exists;
      exists.mockImplementation(async (appmapFileName: PathLike): Promise<boolean> => {
        return Promise.resolve(existingFileNames.includes(appmapFileName.toString()));
      });
      const mockLunr: lunr.Index = {
        search,
      } as unknown as lunr.Index;
      appMapIndex = new AppMapIndex(
        'appmapDir',
        'mock appmaps list' as unknown as Map<string, number>,
        mockLunr
      );

      const searchResults = await appMapIndex.search('login');
      expect(searchResults.numResults).toEqual(1);
      expect(searchResults.results).toEqual([{ appmap: 'appmap1', score: 1 }]);
    });
  });
});
