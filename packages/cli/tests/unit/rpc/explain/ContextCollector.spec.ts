import { SearchRpc } from '@appland/rpc';
import { ContextCollector, EventCollector } from '../../../../src/rpc/explain/collectContext';
import AppMapIndex from '../../../../src/fulltext/AppMapIndexSQLite';
import applyContext from '../../../../src/cmds/context-provider/applyContext';
import { ContextResult } from '../../../../src/cmds/context-provider/context-provider';

jest.mock('../../../../src/fulltext/AppMapIndexSQLite');
jest.mock('../../../../src/cmds/context-provider/applyContext');

describe('ContextCollector', () => {
  const vectorTerms = ['login', 'user'];
  const charLimit = 5000;
  let appmapIndex: AppMapIndex;
  let contextCollector: ContextCollector;

  beforeEach(() => {
    appmapIndex = {
      search: jest.fn().mockRejectedValue(`Unexpected call to AppMapIndex#search`),
    } as unknown as AppMapIndex;
    contextCollector = new ContextCollector(appmapIndex, ['a', 'b'], vectorTerms, charLimit);
  });

  afterEach(() => jest.resetAllMocks());

  describe('collectContext', () => {
    it('returns context for specified appmaps', async () => {
      const mockAppmaps = ['appmap1', 'appmap2'];
      contextCollector.appmaps = mockAppmaps;

      const mockContext = {
        sequenceDiagrams: ['diagram1', 'diagram2'],
        codeSnippets: new Map(),
        codeObjects: new Set(),
      };
      const appliedContext: ContextResult = [{ type: 'sequenceDiagram', content: 'diagram1' }];
      const expectedContext = {
        sequenceDiagrams: ['diagram1'],
        codeSnippets: new Map(),
        codeObjects: new Set(),
      };

      appmapIndex.search = jest.fn().mockRejectedValue(new Error('Unexpected call to search'));

      EventCollector.prototype.collectEvents = jest.fn().mockResolvedValue({
        results: [],
        context: mockContext,
        contextSize: 4545,
      });

      jest.mocked(applyContext).mockReturnValue(appliedContext);

      const collectedContext = await contextCollector.collectContext();

      expect(collectedContext.searchResponse.numResults).toBe(mockAppmaps.length);
      expect(collectedContext.context).toEqual(expectedContext);

      expect(applyContext).toHaveBeenCalledTimes(2);
      expect(applyContext).toHaveBeenAlwaysCalledWith(mockContext, { charLimit });
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
          },
        ],
      };
      appmapIndex.search = jest.fn().mockResolvedValue(mockSearchResponse);

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

      jest.mocked(applyContext).mockReturnValue([]);

      const collectedContext = await contextCollector.collectContext();

      expect(appmapIndex.search).toHaveBeenCalledWith(vectorTerms, {
        maxResults: expect.any(Number),
      });
      expect(collectedContext.searchResponse.numResults).toBe(10);
      expect(collectedContext.context).toEqual(mockContext);
    });
  });
});
