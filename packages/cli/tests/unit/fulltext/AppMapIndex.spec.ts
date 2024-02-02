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

      expect(appMapIndex.search('login', { maxResults: 3 })).resolves.toEqual({
        numResults: 1,
        results: [{ appmap: 'appmap1', score: 1 }],
        type: 'appmap',
      });
    });
  });
});
