/* eslint-disable @typescript-eslint/no-unsafe-return */
import collectSearchContext from '../../../../src/rpc/explain/collect-search-context';
import * as AppMapFileIndex from '../../../../src/rpc/explain/index/appmap-file-index';
import * as ProjectFileIndex from '../../../../src/rpc/explain/index/project-file-index';
import * as ProjectFileSnippetIndex from '../../../../src/rpc/explain/index/project-file-snippet-index';
import { ContextV2 } from '@appland/navie';

jest.mock('../../../../src/rpc/explain/index/appmap-file-index.ts', () => ({
  ...jest.requireActual('../../../../src/rpc/explain/index/appmap-file-index.ts'),
  searchAppMapFiles: jest.fn(),
}));

jest.mock('../../../../src/rpc/explain/index/project-file-index.ts', () => ({
  ...jest.requireActual('../../../../src/rpc/explain/index/project-file-index.ts'),
  searchProjectFiles: jest.fn(),
}));

jest.mock('../../../../src/rpc/explain/index/project-file-snippet-index.ts', () => ({
  ...jest.requireActual('../../../../src/rpc/explain/index/project-file-snippet-index.ts'),
  buildProjectFileSnippetIndex: jest.fn().mockResolvedValue({
    search: jest.fn().mockReturnValue({
      searchResponse: {},
      context: [],
      contextSize: 0,
    }),
    close: jest.fn(),
  }),
}));

describe('collectSearchContext', () => {
  const appmapDirectories = ['dir1', 'dir2'];
  const sourceDirectories = ['src1', 'src2'];
  const vectorTerms = ['term1', 'term2'];
  const charLimit = 1000;

  it('should emit appmaps provided in the request', async () => {
    const request = { appmaps: ['dir1/appmap1', 'dir2/appmap2'] };
    const result = await collectSearchContext(
      appmapDirectories,
      sourceDirectories,
      vectorTerms,
      charLimit,
      request
    );

    expect(result.searchResponse.numResults).toBe(request.appmaps.length);
    expect(result.context).toEqual([]);
  });

  it('should search appmap files when appmaps are not provided', async () => {
    (AppMapFileIndex.searchAppMapFiles as jest.Mock).mockResolvedValue({
      results: [{ appmap: 'appmap1', directory: 'dir1', score: 1 }],
      stats: {},
    });

    const result = await collectSearchContext(
      appmapDirectories,
      sourceDirectories,
      vectorTerms,
      charLimit
    );

    expect(AppMapFileIndex.searchAppMapFiles as jest.Mock).toHaveBeenCalledWith(
      appmapDirectories,
      vectorTerms,
      expect.any(Number)
    );
    expect(result.searchResponse.numResults).toBe(1);
  });

  it('should process and handle data returned from search functions', async () => {
    (AppMapFileIndex.searchAppMapFiles as jest.Mock).mockResolvedValue({
      results: [{ appmap: 'appmap1', directory: 'dir1', score: 1 }],
      stats: {},
    });
    (ProjectFileIndex.searchProjectFiles as jest.Mock).mockResolvedValue([
      { file: 'file1', content: 'content1' },
    ]);

    const result = await collectSearchContext(
      appmapDirectories,
      sourceDirectories,
      vectorTerms,
      charLimit
    );

    expect(result.searchResponse.numResults).toBe(1);
    expect(result.context).toEqual([]);
  });

  it('should search project files and build snippet index', async () => {
    (ProjectFileIndex.searchProjectFiles as jest.Mock).mockResolvedValue([
      { file: 'file1', content: 'content1' },
    ]);

    const result = await collectSearchContext(
      appmapDirectories,
      sourceDirectories,
      vectorTerms,
      charLimit
    );

    expect(ProjectFileIndex.searchProjectFiles as jest.Mock).toHaveBeenCalledWith(
      sourceDirectories,
      undefined,
      undefined,
      vectorTerms
    );
    expect(ProjectFileSnippetIndex.buildProjectFileSnippetIndex as jest.Mock).toHaveBeenCalled();
    expect(result.context).toEqual([]);
  });

  it('should continue gathering context to meet the char limit', async () => {
    const item1: ContextV2.ContextItem = {
      type: ContextV2.ContextItemType.CodeSnippet,
      content: 'short',
      score: 1,
    };
    const item2: ContextV2.ContextItem = {
      type: ContextV2.ContextItemType.CodeSnippet,
      content: 'longer content to try and meet the char limit',
      score: 0.9,
    };
    const mockSearchSnippets = jest
      .fn()
      .mockReturnValueOnce({
        searchResponse: {},
        context: [item1],
        contextSize: 100,
      })
      .mockReturnValue({
        searchResponse: {},
        context: [item1, item2],
        contextSize: 200,
      });

    (ProjectFileSnippetIndex.buildProjectFileSnippetIndex as jest.Mock).mockResolvedValue({
      search: mockSearchSnippets,
      close: jest.fn(),
    });

    const result = await collectSearchContext(
      appmapDirectories,
      sourceDirectories,
      vectorTerms,
      charLimit
    );

    expect(mockSearchSnippets).toHaveBeenCalledTimes(3);
    expect(result.context).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'code-snippet' }),
        expect.objectContaining({ type: 'code-snippet' }),
      ])
    );
  });
});
