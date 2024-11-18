import { SearchRpc } from '@appland/rpc';
import * as navie from '@appland/navie';

import collectContext, { buildContextRequest } from '../../../../src/rpc/explain/collect-context';

// jest.mock('../../../../src/fulltext/AppMapIndex');
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
    const keywords = ['login', 'user'];
    const charLimit = 5000;

    beforeEach(() => {
      jest.mocked(navie.applyContext).mockImplementation((context) => context);
    });

    describe('with empty vector terms', () => {
      it('returns an empty context', async () => {
        const emptyVectorTerms = ['', ' '];

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
  });

  //     beforeEach(() => {
  //       contextCollector = new ContextCollector(['a', 'b'], [], keywords, charLimit);
  //     });

  //     it('returns context for specified appmaps', async () => {
  //       const mockAppmaps = ['appmap1', 'appmap2'];
  //       contextCollector.appmaps = mockAppmaps;

  //       const mockContext: navie.ContextV2.ContextResponse = [
  //         {
  //           type: navie.ContextV2.ContextItemType.SequenceDiagram,
  //           content: 'diagram1',
  //         },
  //         {
  //           type: navie.ContextV2.ContextItemType.SequenceDiagram,
  //           content: 'diagram2',
  //         },
  //       ];

  //       AppMapIndex.search = jest.fn().mockRejectedValue(new Error('Unexpected call to search'));

  //       EventCollector.prototype.collectEvents = jest.fn().mockResolvedValue({
  //         results: [],
  //         context: mockContext,
  //         contextSize: 4545,
  //       });

  //       const collectedContext = await contextCollector.collectContext();

  //       expect(collectedContext.searchResponse.numResults).toBe(mockAppmaps.length);
  //       expect(collectedContext.context).toEqual(mockContext);
  //     });

  //     it('handles search across all appmaps', async () => {
  //       const mockSearchResponse: SearchRpc.SearchResponse = {
  //         numResults: 10,
  //         results: [
  //           {
  //             appmap: 'appmap1',
  //             directory: 'a',
  //             score: 1,
  //             events: [{ fqid: 'function:1', score: 1, eventIds: [1, 2] }],
  //           },
  //           {
  //             appmap: 'appmap2',
  //             directory: 'a',
  //             score: 1,
  //             events: [{ fqid: 'function:2', score: 1, eventIds: [3, 4] }],
  //           },
  //           {
  //             appmap: 'appmap3',
  //             directory: 'b',
  //             score: 1,
  //             events: [{ fqid: 'function:3', score: 1, eventIds: [5, 6] }],
  //           },
  //         ],
  //       };

  //       AppMapIndex.search = jest.fn().mockResolvedValue(mockSearchResponse);

  //       const mockContext: navie.ContextV2.ContextResponse = [
  //         {
  //           type: navie.ContextV2.ContextItemType.SequenceDiagram,
  //           content: 'diagram1',
  //         },
  //       ];

  //       EventCollector.prototype.collectEvents = jest.fn().mockResolvedValue({
  //         results: [],
  //         context: mockContext,
  //         contextSize: 3000,
  //       });

  //       const collectedContext = await contextCollector.collectContext();

  //       expect(AppMapIndex.search).toHaveBeenCalledWith(['a', 'b'], keywords.join(' '), {
  //         maxResults: expect.any(Number),
  //       });
  //       expect(collectedContext.searchResponse.numResults).toBe(10);
  //       expect(collectedContext.context).toEqual(mockContext);
  //     });


});
