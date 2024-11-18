/* eslint-disable @typescript-eslint/no-unsafe-return */
import { join } from 'path';

import * as search from '@appland/search';

import {
  buildProjectFileSnippetIndex,
  snippetContextItem,
} from '../../../../../src/rpc/explain/index/project-file-snippet-index';
import * as AppMapIndex from '../../../../../src/fulltext/appmap-index';
import { CloseableIndex } from '../../../../../src/rpc/explain/index/build-index-in-temp-dir';
import { SearchResult } from '../../../../../src/fulltext/appmap-match';

jest.mock('@appland/search', () => ({
  ...jest.requireActual('@appland/search'),
  readFileSafe: jest.fn(),
}));

jest.mock('../../../../../src/fulltext/appmap-index', () => ({
  ...jest.requireActual('../../../../../src/fulltext/appmap-index'),
  readIndexFile: jest.fn(),
}));

describe('project-file-snippet-index', () => {
  beforeEach(() => jest.restoreAllMocks());
  beforeEach(() => jest.resetAllMocks());

  describe('snippetContextItem', () => {
    describe('query', () => {
      it('should return a snippet context item', () => {
        const snippet = {
          snippetId: { type: 'query', id: 'the-query' },
          directory: 'a',
          score: 1,
          content: 'content',
        };
        const result = snippetContextItem(snippet);
        expect(result).toEqual({
          type: 'data-request',
          content: 'content',
          directory: 'a',
          score: 1,
        });
      });
    });
    describe('route', () => {
      it('should return a snippet context item', () => {
        const snippet = {
          snippetId: { type: 'route', id: 'the-route' },
          directory: 'a',
          score: 1,
          content: 'content',
        };
        const result = snippetContextItem(snippet);
        expect(result).toEqual({
          type: 'data-request',
          content: 'content',
          directory: 'a',
          score: 1,
        });
      });
    });
    describe('external-route', () => {
      it('should return a snippet context item', () => {
        const snippet = {
          snippetId: { type: 'external-route', id: 'the-route' },
          directory: 'a',
          score: 1,
          content: 'content',
        };
        const result = snippetContextItem(snippet);
        expect(result).toEqual({
          type: 'data-request',
          content: 'content',
          directory: 'a',
          score: 1,
        });
      });
    });
    describe('code-snippet', () => {
      it('should return a snippet context item', () => {
        const snippet = {
          snippetId: { type: 'code-snippet', id: 'path/to/item.py:1-3' },
          directory: 'a',
          score: 1,
          content: 'content',
        };
        const result = snippetContextItem(snippet);
        expect(result).toEqual({
          type: 'code-snippet',
          content: 'content',
          directory: 'a',
          score: 1,
          location: 'path/to/item.py:1-3',
        });
      });
    });
  });

  describe('buildProjectFileSnippetIndex', () => {
    let index: CloseableIndex<search.SnippetIndex>;

    afterEach(() => index?.close());

    it('should build a snippet index', async () => {
      (search.readFileSafe as jest.Mock).mockImplementation((path: string) => {
        if (path === 'a/path/to/item.py') return Promise.resolve('def item():\n  return 42\n');

        if (path === 'b/path/to/another.py')
          return Promise.resolve('def another():\n  return 21\n');

        throw new Error(`Unexpected path: ${path}`);
      });

      const fileSearchResults: search.FileSearchResult[] = [
        {
          directory: 'a',
          filePath: 'path/to/item.py',
          score: 1.0,
        },
        {
          directory: 'b',
          filePath: 'path/to/another.py',
          score: 1.0,
        },
      ];
      const appmapSearchResults = [];

      index = await buildProjectFileSnippetIndex(fileSearchResults, appmapSearchResults);

      expect(index).toBeDefined();
      expect(search.readFileSafe as jest.Mock).toHaveBeenCalledTimes(2);
      expect(search.readFileSafe as jest.Mock).toHaveBeenCalledWith(join('a', 'path/to/item.py'));
      expect(search.readFileSafe as jest.Mock).toHaveBeenCalledWith(
        join('b', 'path/to/another.py')
      );

      const result = index.index.searchSnippets('item', 10);
      expect(result).toHaveLength(1);
      expect(result[0].content).toEqual('def item():\n  return 42');
    });

    describe('indexing AppMap data requests', () => {
      it('indexes a query', async () => {
        const classMap: AppMapIndex.ClassMapEntry[] = [
          {
            type: 'query',
            name: 'SELECT * FROM table1',
            children: [],
          },
        ];
        (AppMapIndex.readIndexFile as jest.Mock).mockResolvedValue(classMap);

        const fileSearchResults: search.FileSearchResult[] = [];
        const appmapSearchResults: SearchResult[] = [
          {
            appmap: 'path/to/appmap_1.appmap.json',
            directory: 'dir1',
            score: 1.0,
          },
        ];

        index = await buildProjectFileSnippetIndex(fileSearchResults, appmapSearchResults);

        expect(AppMapIndex.readIndexFile as jest.Mock).toHaveBeenCalledTimes(1);
        expect(AppMapIndex.readIndexFile as jest.Mock).toHaveBeenCalledWith(
          'path/to/appmap_1',
          'classMap'
        );

        const result = index.index.searchSnippets('table1', 10);
        expect(result).toHaveLength(1);
        expect(result[0].content).toEqual('SELECT * FROM table1');
      });

      it('boosts a code snippet', async () => {
        const classMap: AppMapIndex.ClassMapEntry[] = [
          {
            type: 'package',
            name: 'package1',
            children: [
              {
                type: 'function',
                name: 'func1',
                sourceLocation: 'path/to/func1.py:1',
                children: [],
              },
            ],
          },
        ];

        (AppMapIndex.readIndexFile as jest.Mock).mockResolvedValue(classMap);
        (search.readFileSafe as jest.Mock).mockImplementation((path: string) => {
          if (path === 'path/to/func1.py') return Promise.resolve('def myfunc():\n  return 42\n');

          if (path === 'path/to/func2.py') return Promise.resolve('def myfunc():\n  return 21\n');

          throw new Error(`Unexpected path: ${path}`);
        });

        const fileSearchResults: search.FileSearchResult[] = [
          {
            directory: 'path/to',
            filePath: 'func1.py',
            score: 1.0,
          },
          {
            directory: 'path/to',
            filePath: 'func2.py',
            score: 1.0,
          },
        ];
        const appmapSearchResults: SearchResult[] = [
          {
            appmap: 'path/to/appmap_1.appmap.json',
            directory: 'dir1',
            score: 1.0,
          },
        ];

        index = await buildProjectFileSnippetIndex(fileSearchResults, appmapSearchResults);

        expect(AppMapIndex.readIndexFile as jest.Mock).toHaveBeenCalledTimes(1);
        expect(AppMapIndex.readIndexFile as jest.Mock).toHaveBeenCalledWith(
          'path/to/appmap_1',
          'classMap'
        );

        expect(search.readFileSafe as jest.Mock).toHaveBeenCalledTimes(2);
        expect(search.readFileSafe as jest.Mock).toHaveBeenCalledWith(join('path/to/func1.py'));
        expect(search.readFileSafe as jest.Mock).toHaveBeenCalledWith(join('path/to/func2.py'));

        const result = index.index.searchSnippets('myfunc', 10);
        expect(result).toHaveLength(2);
        expect(result[0].snippetId).toEqual({ type: 'code-snippet', id: 'path/to/func1.py:1' });
        expect(result[1].snippetId).toEqual({ type: 'code-snippet', id: 'path/to/func2.py:1' });
        // Row 0 should have approximately twice the score of row 1
        expect(result[1].score * 2).toBeCloseTo(result[0].score);
      });
    });
  });
});
