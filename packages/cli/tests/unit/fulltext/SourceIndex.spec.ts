import sqlite3 from 'better-sqlite3';
import { SourceIndex, SourceIndexDocument } from '../../../src/fulltext/SourceIndex';
import queryKeywords from '../../../src/fulltext/queryKeywords';

describe('SourceIndex', () => {
  let sourceIndex: SourceIndex;
  let database: sqlite3.Database;

  beforeEach(() => (database = new sqlite3(':memory:')));

  describe('when matches are found', () => {
    const files: SourceIndexDocument[] = [
      {
        directory: __dirname,
        fileName: 'FileIndex.spec.ts',
      },
      {
        directory: __dirname,
        fileName: 'SourceIndex.spec.ts',
      },
    ];

    beforeEach(async () => {
      sourceIndex = new SourceIndex(database);
      sourceIndex.initializeIndex();
      await sourceIndex.indexFiles(files);
    });
    afterEach(() => sourceIndex.close());

    it('returns matching source code snippets', () => {
      const indexWords = ['index', 'source'];

      const results = sourceIndex.search(['SourceIndex'], 10);
      expect(results.length).toBeTruthy();
      expect(
        results.every((r) =>
          queryKeywords(r.content).some((keyword) => indexWords.includes(keyword))
        )
      ).toBeTruthy();
    });
  });
});
