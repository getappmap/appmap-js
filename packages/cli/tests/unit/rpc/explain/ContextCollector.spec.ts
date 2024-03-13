import { SearchRpc } from '@appland/rpc';
import { ContextCollector, EventCollector } from '../../../../src/rpc/explain/collectContext';
import AppMapIndex, { SearchResponse } from '../../../../src/fulltext/AppMapIndex';

jest.mock('../../../../src/fulltext/AppMapIndex');

describe('ContextCollector', () => {
  const appmapDir = 'test/appmaps';
  const vectorTerms = ['login', 'user'];
  const charLimit = 5000;
  let contextCollector: ContextCollector;

  beforeEach(() => {
    contextCollector = new ContextCollector(['a', 'b'], vectorTerms, charLimit);
  });

  describe('collectContext', () => {
    it('returns context for specified appmaps', async () => {
      const mockAppmaps = ['appmap1', 'appmap2'];
      contextCollector.appmaps = mockAppmaps;

      const mockContext = {
        sequenceDiagrams: ['diagram1', 'diagram2'],
        codeSnippets: new Map(),
        codeObjects: new Set(),
      };

      AppMapIndex.search = jest.fn().mockRejectedValue(new Error('Unexpected call to search'));

      EventCollector.prototype.collectEvents = jest.fn().mockResolvedValue({
        results: [],
        context: mockContext,
        contextSize: 4545,
      });

      const collectedContext = await contextCollector.collectContext();

      expect(collectedContext.searchResponse.numResults).toBe(mockAppmaps.length);
      expect(collectedContext.context).toEqual(mockContext);
    });

    it('handles search across all appmaps', async () => {
      const mockSearchResponse: SearchRpc.SearchResponse = {
        numResults: 10,
        results: [
          {
            appmap: 'appmap1',
            directory: 'a',
            score: 1,
            events: [{ fqid: 'function:1', score: 1, eventIds: [1, 2] }],
          },
          {
            appmap: 'appmap2',
            directory: 'a',
            score: 1,
            events: [{ fqid: 'function:2', score: 1, eventIds: [3, 4] }],
          },
          {
            appmap: 'appmap3',
            directory: 'b',
            score: 1,
            events: [{ fqid: 'function:3', score: 1, eventIds: [5, 6] }],
          }
        ],
      };

      AppMapIndex.search = jest.fn().mockResolvedValue(mockSearchResponse);

      const mockContext = {
        sequenceDiagrams: [],
        codeSnippets: new Map(),
        codeObjects: new Set(),
      };

      EventCollector.prototype.collectEvents = jest.fn().mockResolvedValue({
        results: [],
        context: mockContext,
        contextSize: 3000,
      });

      const collectedContext = await contextCollector.collectContext();

      expect(AppMapIndex.search).toHaveBeenCalledWith(['a', 'b'], vectorTerms.join(' '), {
        maxResults: expect.any(Number),
      });
      expect(collectedContext.searchResponse.numResults).toBe(10);
      expect(collectedContext.context).toEqual(mockContext);
    });
  });
});
