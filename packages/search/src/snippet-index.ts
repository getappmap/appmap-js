import assert from 'assert';
import sqlite3 from 'better-sqlite3';
import { SessionId } from './session-id';

const CREATE_SNIPPET_CONTENT_TABLE_SQL = `CREATE VIRTUAL TABLE snippet_content USING fts5(
  snippet_id UNINDEXED,
  directory UNINDEXED,
  file_symbols,
  file_words,
  content UNINDEXED,
  tokenize = 'porter unicode61'
)`;

const CREATE_SNIPPET_BOOST_TABLE_SQL = `CREATE TABLE snippet_boost (
  session_id TEXT,
  snippet_id TEXT,
  boost_factor REAL,
  PRIMARY KEY (session_id, snippet_id)
)`;

const INSERT_SNIPPET_SQL = `INSERT INTO snippet_content 
(snippet_id, directory, file_symbols, file_words, content)
VALUES (?, ?, ?, ?, ?)`;

const DELETE_SESSION_SQL = `DELETE FROM snippet_boost WHERE session_id LIKE ?`;

const UPDATE_SNIPPET_BOOST_SQL = `INSERT OR REPLACE INTO snippet_boost 
(session_id, snippet_id, boost_factor)
VALUES (?, ?, ?)`;

const SEARCH_SNIPPET_SQL = `SELECT
  snippet_content.directory,
  snippet_content.snippet_id,
  snippet_content.content,
  (bm25(snippet_content, 1)*3.0 + bm25(snippet_content, 2)*2.0 + bm25(snippet_content, 3)*1.0)
      * COALESCE(snippet_boost.boost_factor, 1.0) * -1
    AS score
FROM
  snippet_content
LEFT JOIN
  snippet_boost
ON
  snippet_content.snippet_id = snippet_boost.snippet_id
  AND snippet_boost.session_id = ?
WHERE
  snippet_content MATCH ?
ORDER BY
  score DESC
LIMIT ?`;

export enum SnippetType {
  FileChunk = 'file-chunk',
}

export type SnippetId = {
  type: string;
  id: string;
};

export function fileChunkSnippetId(filePath: string, startLine?: number): SnippetId {
  return {
    type: 'file-chunk',
    id: [filePath, startLine]
      .filter((t): t is string | number => Boolean(t))
      .map(encodeURIComponent)
      .join(':'),
  };
}

export function parseFileChunkSnippetId(snippetId: SnippetId): {
  filePath: string;
  startLine?: number;
} {
  const type = snippetId.type;
  assert(type === SnippetType.FileChunk);
  const parts = snippetId.id.split(':');
  const filePath = parts.shift();
  assert(filePath);
  const startLine = parts.shift();
  return {
    filePath: decodeURIComponent(filePath),
    startLine: startLine ? parseInt(startLine, 10) : undefined,
  };
}

export function encodeSnippetId(snippetId: SnippetId): string {
  return [snippetId.type, snippetId.id].join(':');
}

export function parseSnippetId(snippetId: string): SnippetId {
  const parts = snippetId.split(':');
  const type = parts.shift();
  assert(type);
  const id = parts.join(':');
  return {
    type,
    id,
  };
}

export type SnippetSearchResult = {
  snippetId: SnippetId;
  directory: string;
  score: number;
  content: string;
};

type SnippetSearchRow = {
  snippet_id: string;
  directory: string;
  score: number;
  content: string;
};

export default class SnippetIndex {
  #insertSnippet: sqlite3.Statement;
  #updateSnippetBoost: sqlite3.Statement;
  #deleteSession: sqlite3.Statement<[string]>;
  #searchSnippet: sqlite3.Statement<[string, string, number]>;

  constructor(public database: sqlite3.Database) {
    this.database.exec(CREATE_SNIPPET_CONTENT_TABLE_SQL);
    this.database.exec(CREATE_SNIPPET_BOOST_TABLE_SQL);
    this.database.pragma('journal_mode = OFF');
    this.database.pragma('synchronous = OFF');
    this.#insertSnippet = this.database.prepare(INSERT_SNIPPET_SQL);
    this.#deleteSession = this.database.prepare(DELETE_SESSION_SQL);
    this.#updateSnippetBoost = this.database.prepare(UPDATE_SNIPPET_BOOST_SQL);
    this.#searchSnippet = this.database.prepare(SEARCH_SNIPPET_SQL);
  }

  /**
   * Deletes all data associated with a specific session.
   * @param sessionId - The session identifier to delete data for.
   */
  deleteSession(sessionId: string): void {
    this.#deleteSession.run(sessionId);
  }

  /**
   * Indexes a code snippet for searchability.
   * @param snippetId - The unique identifier for the snippet.
   * @param directory - The directory where the snippet is located.
   * @param symbols - Symbols (e.g., class names) in the snippet.
   * @param words - General words in the snippet.
   * @param content - The actual content of the snippet.
   */
  indexSnippet(
    snippetId: SnippetId,
    directory: string,
    symbols: string,
    words: string,
    content: string
  ): void {
    this.#insertSnippet.run(encodeSnippetId(snippetId), directory, symbols, words, content);
  }

  /**
   * Boosts the relevance score of a specific snippet for a given session.
   * @param sessionId - The session identifier to associate the boost with.
   * @param snippetId - The identifier of the snippet to boost.
   * @param boostFactor - The factor by which to boost the snippet's relevance.
   */
  boostSnippet(sessionId: SessionId, snippetId: SnippetId, boostFactor: number): void {
    this.#updateSnippetBoost.run(sessionId, encodeSnippetId(snippetId), boostFactor);
  }

  searchSnippets(sessionId: SessionId, query: string, limit = 10): SnippetSearchResult[] {
    const rows = this.#searchSnippet.all(sessionId, query, limit) as SnippetSearchRow[];
    return rows.map((row) => ({
      directory: row.directory,
      snippetId: parseSnippetId(row.snippet_id),
      score: row.score,
      content: row.content,
    }));
  }

  close() {
    this.database.close();
  }
}
