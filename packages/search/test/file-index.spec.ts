import { strict as assert } from 'assert';

import sqlite3 from 'node-sqlite3-wasm';

import FileIndex, { FileSearchResult } from '../src/file-index';

describe('FileIndex', () => {
  let db: sqlite3.Database;
  let index: FileIndex;
  const directory = 'src';

  beforeEach(() => {
    db = new sqlite3.Database(':memory:');
    index = new FileIndex(db);
  });

  afterEach(() => {
    if (index) index.close();
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
});
