import * as navie from '@appland/navie';

import * as collectSearchContext from '../../../../src/rpc/explain/collect-search-context';
import collectContext, { buildContextRequest } from '../../../../src/rpc/explain/collect-context';

jest.mock('../../../../src/rpc/explain/collect-search-context');
jest.mock('@appland/navie');

describe('collect-context', () => {
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
  });

  describe('collectContext', () => {
    const charLimit = 5000;

    beforeEach(() => {
      jest.mocked(navie.applyContext).mockImplementation((context) => context);
    });

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

        expect(result.searchResponse.numResults).toBe(2);
        expect(result.context).toEqual(['context1', 'context2']);
      });
    });
  });
});
