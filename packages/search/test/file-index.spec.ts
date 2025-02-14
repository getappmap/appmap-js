import { strict as assert } from 'assert';

import sqlite3 from 'node-sqlite3-wasm';

import FileIndex, { FileSearchResult } from '../src/file-index';
import { generateSessionId, SessionId } from '../src/session-id';

type FileBoost = {
  session_id: SessionId;
  file_path: string;
  boost: number;
};

describe('FileIndex', () => {
  let db: sqlite3.Database;
  let index: FileIndex;
  let sessionId: SessionId;
  const directory = 'src';

  beforeEach(() => {
    db = new sqlite3.Database(':memory:');
    index = new FileIndex(db);
    sessionId = generateSessionId();
  });

  afterEach(() => {
    if (index) index.close();
  });

  it('should insert and search a file', () => {
    index.indexFile(directory, 'test.txt', 'symbol1', 'word1');
    const results = index.search(sessionId, 'symbol1');
    assert.equal(results.length, 1);
    assert.equal(results[0].filePath, 'test.txt');
  });

  it('should update the boost factor of a file', () => {
    index.indexFile(directory, 'test2.txt', 'symbol2', 'word2');
    index.boostFile(sessionId, 'test2.txt', -2.0);
    const results = index.search(sessionId, 'symbol2');
    expect(results.map((r: FileSearchResult) => r.directory)).toEqual([directory]);
    expect(results.map((r: FileSearchResult) => r.filePath)).toEqual(['test2.txt']);
    expect(results[0].score).toBeLessThan(0);
  });

  it('should apply the session id to the boost factors', () => {
    index.indexFile(directory, 'test2.txt', 'symbol2', 'word2');
    index.boostFile(sessionId, 'test2.txt', 2.0);
    const otherSessionId = generateSessionId();
    const results = index.search(otherSessionId, 'symbol2');
    expect(results.map((r: FileSearchResult) => r.directory)).toEqual([directory]);
    expect(results.map((r: FileSearchResult) => r.filePath)).toEqual(['test2.txt']);
    expect(results[0].score).toBeGreaterThan(0);
  });

  it('should return results ordered by score', () => {
    index.indexFile(directory, 'test3.txt', 'symbol1 symbol3', 'word1 word3');
    index.indexFile(directory, 'test4.txt', 'symbol2 symbol3', 'word1 word4');
    index.boostFile(sessionId, 'test4.txt', 2.0);

    let results = index.search(sessionId, 'word1');
    expect(results.map((r: FileSearchResult) => r.filePath)).toEqual(['test4.txt', 'test3.txt']);

    results = index.search(sessionId, 'symbol3');
    expect(results.map((r: FileSearchResult) => r.filePath)).toEqual(['test4.txt', 'test3.txt']);

    results = index.search(sessionId, 'symbol2');
    expect(results.map((r: FileSearchResult) => r.filePath)).toEqual(['test4.txt']);
  });

  describe('session deletion', () => {
    it('should delete the session data', () => {
      index.indexFile(directory, 'test2.txt', 'symbol2', 'word2');
      index.boostFile(sessionId, 'test2.txt', 2.0);

      let boostRecords = db.prepare('SELECT * FROM file_boost').all() as FileBoost[];
      expect(boostRecords.length).toEqual(1);
      expect(boostRecords[0].session_id).toEqual(sessionId);

      index.deleteSession(sessionId);

      boostRecords = db.prepare('SELECT * FROM file_boost').all() as FileBoost[];
      expect(boostRecords.length).toEqual(0);
    });
  });
});
