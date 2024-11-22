/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { SnippetIndex } from '@appland/search';
import sqlite3 from 'better-sqlite3';

import indexEvents from '../../../../../src/rpc/explain/index/index-events';
import { SearchResult } from '../../../../../src/rpc/explain/index/appmap-match';
import * as AppMapIndex from '../../../../../src/rpc/explain/index/appmap-index';

jest.mock('../../../../../src/rpc/explain/index/appmap-index', () => ({
  ...jest.requireActual('../../../../../src/rpc/explain/index/appmap-index'),
  readIndexFile: jest.fn(),
}));

describe('index-events', () => {
  describe('indexAppMapEvents', () => {
    let db: sqlite3.Database;
    let snippetIndex: SnippetIndex;

    beforeEach(() => (db = new sqlite3(':memory:')));
    beforeEach(() => (snippetIndex = new SnippetIndex(db)));
    afterEach(() => db.close());

    it('should index events', async () => {
      const searchResults: SearchResult[] = [
        {
          directory: 'tmp/appmap',
          appmap: 'appmap1',
          score: 1,
        },
      ];

      const classMap: AppMapIndex.ClassMapEntry[] = [
        {
          type: 'package',
          name: 'package1',
          children: [
            {
              type: 'class',
              name: 'class1',
              children: [
                {
                  type: 'function',
                  name: 'method1',
                  sourceLocation: 'path/to/file1:10',
                  children: [],
                },
              ],
            },
          ],
        },
        {
          type: 'query',
          name: 'SELECT * FROM table1',
          children: [],
        },
        {
          type: 'route',
          name: '/api/endpoint',
          children: [],
        },
        {
          type: 'external-route',
          name: 'GET https://example.com/api/endpoint',
          children: [],
        },
      ];

      (AppMapIndex.readIndexFile as jest.Mock).mockResolvedValue(classMap);

      await indexEvents(snippetIndex, searchResults);

      const rows = db.prepare('SELECT * FROM snippet_content ORDER BY snippet_id').all();
      expect(rows.map((r) => (r as any).snippet_id)).toEqual([
        'external-route:GET https://example.com/api/endpoint',
        'query:c78f4ded2dcc9714feb709a35c86af4727eef18d0eb90fe89c6b13b66977b7b1',
        'route:/api/endpoint',
      ]);

      expect(rows.map((r) => (r as any).file_words)).toEqual([
        'get https example com api endpoint route request client http',
        'select table1 sql query database',
        'api endpoint route request server http',
      ]);

      const boostRows = db.prepare('SELECT * FROM snippet_boost ORDER BY snippet_id').all();
      expect(boostRows.map((r) => (r as any).snippet_id)).toEqual([
        'code-snippet:path/to/file1:10',
      ]);
    });
  });
});
