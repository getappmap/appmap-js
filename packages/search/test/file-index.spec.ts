import { strict as assert } from 'node:assert';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import sqlite3 from 'better-sqlite3';

import FileIndex, { FileSearchResult } from '../src/file-index';

describe('FileIndex', () => {
  let db: sqlite3.Database;
  let index: FileIndex;
  let dbPath: string;
  const directory = 'src';

  beforeEach(() => {
    dbPath = join(tmpdir(), `test-file-index-${Date.now()}.sqlite`);
    db = new sqlite3(dbPath);
    index = new FileIndex(db);
  });

  afterEach(async () => {
    if (index) index.close();
    try {
      await rm(dbPath);
    } catch (e) {
      console.warn(`Could not remove test database: ${e}`);
    }
  });

  it('should insert and search a file', async () => {
    await index.index(
      (async function* () {
        yield { directory, filePath: 'test.txt' };
      })(),
      async () => ({ symbols: ['symbol1'], words: ['word1'] })
    );
    const results = index.search('symbol1');
    assert.equal(results.length, 1);
    assert.equal(results[0].filePath, 'test.txt');
  });

  it('should return results ordered by score', async () => {
    await index.index(
      (async function* () {
        yield { directory, filePath: 'test3.txt' };
        yield { directory, filePath: 'test4.txt' };
      })(),
      async (filePath) => {
        if (filePath === 'test3.txt') return { symbols: ['symbol1', 'symbol3'], words: ['word1'] };
        if (filePath === 'test4.txt')
          return { symbols: ['symbol1', 'symbol2', 'symbol3'], words: ['word1', 'word2'] };
      }
    );

    let results = index.search('word1');
    expect(results.map((r: FileSearchResult) => r.filePath)).toEqual(['test3.txt', 'test4.txt']);

    results = index.search('symbol3');
    expect(results.map((r: FileSearchResult) => r.filePath)).toEqual(['test3.txt', 'test4.txt']);

    results = index.search('symbol2');
    expect(results.map((r: FileSearchResult) => r.filePath)).toEqual(['test4.txt']);
  });

  describe('process interruption', () => {
    it('should release database lock when process is killed during indexing', async () => {
      // Set up a file stream that will take some time
      const slowFiles = (async function* () {
        for (let i = 0; i < 1000; i++) {
          yield { directory, filePath: `test${i}.txt` };
          await new Promise((resolve) => setTimeout(resolve, 1)); // Slow down indexing
        }
      })();

      // Start indexing in the background
      const indexingPromise = index.index(slowFiles, async () => ({
        symbols: ['symbol1'],
        words: ['word1'],
      }));

      // Wait a bit for indexing to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Force close without proper cleanup
      index.database.close();

      // Original indexing should have failed
      await expect(indexingPromise).rejects.toThrow();

      // Try to open the database again
      const newDb = sqlite3(dbPath);
      const newIndex = new FileIndex(newDb);

      // Should be able to perform operations
      await newIndex.index(
        (async function* () {
          yield { directory, filePath: 'test.txt' };
        })(),
        async () => ({ symbols: ['symbol1'], words: ['word1'] })
      );

      const results = newIndex.search('symbol1');
      expect(results.length).toBe(1);

      newIndex.close();
    });

    it('should handle concurrent access attempts', async () => {
      // First index some data
      await index.index(
        (async function* () {
          yield { directory, filePath: 'test.txt' };
        })(),
        async () => ({ symbols: ['symbol1'], words: ['word1'] })
      );

      // Try to open another connection while the first is still active
      expect(() => {
        const concurrentDb = new sqlite3(dbPath);
        concurrentDb.exec('SELECT * FROM file_content');
        concurrentDb.close();
      }).not.toThrow();
    });

    it('should recover from an interrupted transaction', async () => {
      // Start a transaction but don't commit
      index.database.exec('BEGIN TRANSACTION');
      index.database.exec(`
        INSERT INTO file_content (directory, file_path, file_symbols, file_words)
        VALUES ('src', 'test.txt', 'symbol1', 'word1')
      `);

      // Force close without commit
      index.database.close();

      // Open new connection
      const newDb = new sqlite3(dbPath);
      const newIndex = new FileIndex(newDb);

      // Database should be usable
      await newIndex.index(
        (async function* () {
          yield { directory, filePath: 'test2.txt' };
        })(),
        async () => ({ symbols: ['symbol2'], words: ['word2'] })
      );

      const results = newIndex.search('symbol2');
      expect(results.length).toBe(1);
      expect(results[0].filePath).toBe('test2.txt');

      newIndex.close();
    });
  });
});
