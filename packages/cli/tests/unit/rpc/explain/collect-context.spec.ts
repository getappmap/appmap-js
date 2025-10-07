import * as collectSearchContext from '../../../../src/rpc/explain/collect-search-context';
import * as collectLocationContext from '../../../../src/rpc/explain/collect-location-context';
import collectContext, {
  buildContextRequest,
  ContextRequest,
} from '../../../../src/rpc/explain/collect-context';
import Location from '../../../../src/rpc/explain/location';

jest.mock('../../../../src/rpc/explain/collect-search-context');
jest.mock('../../../../src/rpc/explain/collect-location-context');
jest.mock('@appland/navie');

describe('collect-context', () => {
  afterEach(() => jest.resetAllMocks());
  afterEach(() => jest.restoreAllMocks());

  describe('buildContextRequest', () => {
    it('builds a context request', () => {
      const request = buildContextRequest(
        ['appmap-dir'],
        ['src'],
        ['appmap-a', 'appmap-b'],
        ['login', 'the', 'user'],
        5000,
        {}
      );
      expect(request).toEqual({
        vectorTerms: ['login', 'user'],
        request: {
          appmaps: ['appmap-a', 'appmap-b'],
          excludePatterns: [
            /(^|[/\\])\.appmap([/\\]|$)/,
            /(^|[/\\])\.navie([/\\]|$)/,
            /(^|[/\\])\.yarn([/\\]|$)/,
            /(^|[/\\])venv([/\\]|$)/,
            /(^|[/\\])\.venv([/\\]|$)/,
            /(^|[/\\])node_modules([/\\]|$)/,
            /(^|[/\\])vendor([/\\]|$)/,
          ],
        },
      });
    });

    it('deduplicates location patterns', () => {
      const request = buildContextRequest(
        ['appmap-dir'],
        ['src'],
        undefined,
        ['login', 'the', 'user'],
        5000,
        {
          locations: [
            'file1.js:10',
            'file1.js:10',
            'file2.js:20',
          ],
        }
      );
      expect(request).toEqual({
        vectorTerms: ['login', 'user'],
        request: {
          excludePatterns: [
            /(^|[/\\])\.appmap([/\\]|$)/,
            /(^|[/\\])\.navie([/\\]|$)/,
            /(^|[/\\])\.yarn([/\\]|$)/,
            /(^|[/\\])venv([/\\]|$)/,
            /(^|[/\\])\.venv([/\\]|$)/,
            /(^|[/\\])node_modules([/\\]|$)/,
            /(^|[/\\])vendor([/\\]|$)/,
          ],
          locations: [Location.parse('file1.js:10'), Location.parse('file2.js:20')],
        },
      });
    });
  });

  describe('collectContext', () => {
    const charLimit = 5000;

    describe('with empty vector terms', () => {
      it('returns an empty context', async () => {
        const emptyVectorTerms = [];

        const result = await collectContext(
          ['appmap-dir'],
          ['src'],
          charLimit,
          emptyVectorTerms,
          {}
        );
        expect(result).toStrictEqual({
          searchResponse: {
            results: [],
            numResults: 0,
          },
          context: [],
        });
        expect(collectLocationContext.default).not.toHaveBeenCalled();
      });
    });

    describe('with vector terms', () => {
      const appmapDirectories = ['dir1', 'dir2'];
      const sourceDirectories = ['src1', 'src2'];
      const vectorTerms = ['term1', 'term2'];

      it('should process vector terms and char limit correctly', async () => {
        (collectSearchContext.default as jest.Mock).mockResolvedValue({
          searchResponse: { results: [], numResults: 2 },
          context: ['context1', 'context2'],
        });

        const request = { locations: [] };
        const result = await collectContext(
          appmapDirectories,
          sourceDirectories,
          charLimit,
          vectorTerms,
          request
        );

        expect(collectSearchContext.default).toHaveBeenCalledWith(
          appmapDirectories,
          sourceDirectories,
          vectorTerms,
          charLimit,
          request
        );
        expect(collectLocationContext.default).not.toHaveBeenCalled();

        expect(result.searchResponse.numResults).toBe(2);
        expect(result.context).toEqual(['context1', 'context2']);
      });
    });

    describe('with locations specified', () => {
      it('should process locations and char limit correctly', async () => {
        (collectLocationContext.default as jest.Mock).mockResolvedValue(['context1', 'context2']);

        const request: ContextRequest = {
          locations: [Location.parse('location1'), Location.parse('location2')],
        };
        const result = await collectContext(
          ['dir1', 'dir2'],
          ['src1', 'src2'],
          charLimit,
          [],
          request
        );

        expect(collectSearchContext.default).not.toHaveBeenCalled();
        expect(collectLocationContext.default).toHaveBeenCalledWith(
          ['src1', 'src2'],
          request.locations,
          []
        );
        expect(result.searchResponse.numResults).toBe(0);
        expect(result.context).toEqual(['context1', 'context2']);
      });
    });
  });
});
