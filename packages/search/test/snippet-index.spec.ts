import { strict as assert } from 'assert';
import sqlite3 from 'better-sqlite3';

import SnippetIndex from '../src/snippet-index';

describe('SnippetIndex', () => {
  let db: sqlite3.Database;
  let index: SnippetIndex;
  const directory = 'src';

  beforeEach(() => {
    db = new sqlite3(':memory:');
    index = new SnippetIndex(db);
  });

  afterEach(() => {
    if (index) index.close();
  });

  it('should insert and search a snippet', () => {
    index.indexSnippet('snippet1', directory, 'test.txt', 1, 10, 'symbol1', 'word1');
    const results = index.searchSnippets('symbol1');
    assert.equal(results.length, 1);
    assert.equal(results[0].snippet_id, 'snippet1');
  });

  it('should update the boost factor of a snippet', () => {
    index.indexSnippet('snippet2', directory, 'test2.txt', 11, 20, 'symbol2', 'word2');
    index.boostSnippet('snippet2', 2.0);
    const results = index.searchSnippets('symbol2');
    assert.equal(results.length, 1);
    assert.equal(results[0].snippet_id, 'snippet2');
  });

  it('should return results ordered by score', () => {
    index.indexSnippet(
      'snippet3',
      directory,
      'test3.txt',
      21,
      30,
      'symbol1 symbol3',
      'word1 word3'
    );
    index.indexSnippet(
      'snippet4',
      directory,
      'test4.txt',
      31,
      40,
      'symbol2 symbol3',
      'word1 word4'
    );

    let results = index.searchSnippets('word1 OR word4');
    assert.equal(results.length, 2);
    assert.equal(results[0].snippet_id, 'snippet4');
    assert.equal(results[1].snippet_id, 'snippet3');

    const unboostedScore = results[1].score;

    index.boostSnippet('snippet3', 2.0);

    results = index.searchSnippets('word1 OR word4');
    assert.equal(results.length, 2);
    assert.equal(results[0].snippet_id, 'snippet3');
    assert.equal(results[1].snippet_id, 'snippet4');

    const boostedScore = results[0].score;
    const scoreMultiple = boostedScore / unboostedScore;
    expect(scoreMultiple).toBeGreaterThan(1.99);
    expect(scoreMultiple).toBeLessThan(2.01);

    results = index.searchSnippets('symbol3');
    assert.equal(results.length, 2);
    assert.equal(results[0].snippet_id, 'snippet3');
    assert.equal(results[1].snippet_id, 'snippet4');
  });
});
