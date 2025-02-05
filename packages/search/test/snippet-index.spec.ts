import { strict as assert } from 'assert';
import sqlite3 from 'better-sqlite3';

import SnippetIndex, {
  fileChunkSnippetId,
  parseFileChunkSnippetId,
  SnippetId,
} from '../src/snippet-index';
import { generateSessionId, SessionId } from '../src/session-id';

type SnippetBoost = {
  session_id: SessionId;
  snippet_id: string;
  boost: number;
};

describe('SnippetIndex', () => {
  let db: sqlite3.Database;
  let index: SnippetIndex;
  let sessionId: SessionId;
  const directory = 'src';

  const snippet1: SnippetId = { type: 'code-snippet', id: 'test.txt:1' };
  const snippet2: SnippetId = { type: 'code-snippet', id: 'test2.txt:11' };
  const snippet3: SnippetId = { type: 'code-snippet', id: 'test3.txt:21' };
  const snippet4: SnippetId = { type: 'code-snippet', id: 'test4.txt:31' };

  beforeEach(() => {
    db = new sqlite3(':memory:');
    index = new SnippetIndex(db);
    sessionId = generateSessionId();
  });

  afterEach(() => {
    if (index) index.close();
  });

  it('should insert and search a snippet', () => {
    const content = 'symbol1 word1';
    index.indexSnippet(snippet1, directory, 'symbol1', 'word1', content);
    const results = index.searchSnippets(sessionId, 'symbol1');
    assert.equal(results.length, 1);
    assert.equal(JSON.stringify(results[0].snippetId), JSON.stringify(snippet1));
    assert.equal(results[0].content, content);
  });

  it('should update the boost factor of a snippet', () => {
    const content = 'symbol2 word2';
    index.indexSnippet(snippet2, directory, 'symbol2', 'word2', content);
    index.boostSnippet(sessionId, snippet2, 2.0);
    const results = index.searchSnippets(sessionId, 'symbol2');
    assert.equal(results.length, 1);
    assert.equal(JSON.stringify(results[0].snippetId), JSON.stringify(snippet2));
  });

  describe('boost factor', () => {
    let unboostedScore: number;

    beforeEach(() => {
      index.indexSnippet(
        snippet3,
        directory,
        'symbol1 symbol3',
        'word1 word3',
        'symbol1 word1 symbol3 word3'
      );
      index.indexSnippet(
        snippet4,
        directory,
        'symbol2 symbol3',
        'word1 word4',
        'symbol2 word1 symbol3 word4'
      );

      const results = index.searchSnippets(sessionId, 'word1 OR word4');
      assert.equal(results.length, 2);
      assert.equal(JSON.stringify(results[0].snippetId), JSON.stringify(snippet4));
      assert.equal(JSON.stringify(results[1].snippetId), JSON.stringify(snippet3));

      unboostedScore = results[1].score;
    });

    it('applies to a session', () => {
      index.boostSnippet(sessionId, snippet3, 2.0);

      let results = index.searchSnippets(sessionId, 'word1 OR word4');
      assert.equal(results.length, 2);
      assert.equal(JSON.stringify(results[0].snippetId), JSON.stringify(snippet3));
      assert.equal(JSON.stringify(results[1].snippetId), JSON.stringify(snippet4));

      const boostedScore = results[0].score;
      const scoreMultiple = boostedScore / unboostedScore;
      expect(scoreMultiple).toBeGreaterThan(1.99);
      expect(scoreMultiple).toBeLessThan(2.01);

      results = index.searchSnippets(sessionId, 'symbol3');
      assert.equal(results.length, 2);
      assert.equal(JSON.stringify(results[0].snippetId), JSON.stringify(snippet3));
      assert.equal(JSON.stringify(results[1].snippetId), JSON.stringify(snippet4));
    });

    it('is ignored on other sessions', () => {
      const otherSessionId = generateSessionId();
      const results = index.searchSnippets(otherSessionId, 'word1 OR word4');
      assert.equal(results.length, 2);
      assert.equal(JSON.stringify(results[0].snippetId), JSON.stringify(snippet4));
      assert.equal(JSON.stringify(results[1].snippetId), JSON.stringify(snippet3));

      expect(results[1].score).toBeCloseTo(unboostedScore);
    });
  });

  describe('session deletion', () => {
    it('should delete the session data', () => {
      const content = 'symbol2 word2';
      index.indexSnippet(snippet2, directory, 'symbol2', 'word2', content);
      index.boostSnippet(sessionId, snippet2, 2.0);

      let boostRecords = db.prepare('SELECT * FROM snippet_boost').all() as SnippetBoost[];
      expect(boostRecords.length).toEqual(1);
      expect(boostRecords[0].session_id).toEqual(sessionId);

      index.deleteSession(sessionId);

      boostRecords = db.prepare('SELECT * FROM snippet_boost').all() as SnippetBoost[];
      expect(boostRecords.length).toEqual(0);
    });
  });

  describe('fileChunkSnippetId', () => {
    it('url encodes file paths', () => {
      const startLine = 10;
      const filePath = 'C:\\Users\\user\\Documents\\file.txt';
      const snippetId = fileChunkSnippetId(filePath, startLine);
      expect(snippetId).toStrictEqual({
        type: 'file-chunk',
        id: `${encodeURIComponent(filePath)}:${startLine}`,
      });
    });
  });

  describe('parseFileChunkSnippetId', () => {
    it('parses a file-chunk snippet identifier with a windows path', () => {
      const filePath = 'C:\\Users\\user\\Documents\\file.txt';
      const startLine = 24;
      expect(
        parseFileChunkSnippetId({
          type: 'file-chunk',
          id: `${encodeURIComponent('C:\\Users\\user\\Documents\\file.txt')}:${startLine}`,
        })
      ).toStrictEqual({
        filePath,
        startLine,
      });
    });
  });
});
