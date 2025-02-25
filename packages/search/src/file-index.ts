import type sqlite3 from 'node-sqlite3-wasm';

import { SessionId } from './session-id';

const CREATE_TABLE_SQL = `CREATE VIRTUAL TABLE file_content USING fts5(
  directory UNINDEXED,
  file_path,
  file_symbols,
  file_words,
  tokenize = 'porter unicode61'
)`;

const CREATE_BOOST_TABLE_SQL = `CREATE TABLE file_boost (
  session_id TEXT,
  file_path TEXT,
  boost_factor REAL,
  PRIMARY KEY (session_id, file_path)
)`;

const INSERT_SQL = `INSERT INTO file_content (directory, file_path, file_symbols, file_words)
VALUES (?, ?, ?, ?)`;

const UPDATE_BOOST_SQL = `INSERT OR REPLACE INTO file_boost (session_id, file_path, boost_factor)
VALUES (?, ?, ?)`;

const DELETE_SESSION_SQL = `DELETE FROM file_boost WHERE session_id LIKE ?`;

const SEARCH_SQL = `SELECT
    file_content.directory,
    file_content.file_path,
    -- directory, file_path, file_symbols, file_words
    -bm25(file_content, 0, 3, 2, 1)
      * COALESCE(file_boost.boost_factor, 1.0) * -1
      AS score
FROM
    file_content
LEFT JOIN
    file_boost
ON
    file_content.file_path = file_boost.file_path
    AND file_boost.session_id = ?
WHERE
    file_content MATCH ?
ORDER BY
    score DESC
LIMIT
  ?
`;

type FileIndexRow = {
  directory: string;
  file_path: string;
  score: number;
};

export type FileSearchResult = {
  directory: string;
  filePath: string;
  score: number;
};

/**
 * The FileIndex class provides an interface to interact with the SQLite search index.
 *
 * The primary responsibilities of this class include:
 * 1. Indexing files by storing their directory paths, file paths, symbols (e.g., class names, method names), and
 *    general words in the database. Symbols are given more weight in the search results.
 * 2. Boosting the relevance score of specific files based on external factors, such as AppMap trace data or error logs.
 * 3. Performing search queries on the indexed files using full-text search with BM25 ranking. The search results are
 *    influenced by both the indexed content and any associated boost factors.
 *
 * The class uses two SQLite tables:
 * - `file_content`: A virtual table that holds the file content and allows for full-text search using BM25 ranking.
 * - `file_boost`: A table that stores boost factors for specific files to enhance their search relevance.
 */
export default class FileIndex {
  #insert: sqlite3.Statement;
  #updateBoost: sqlite3.Statement;
  #deleteSession: sqlite3.Statement;
  #search: sqlite3.Statement;

  constructor(public database: sqlite3.Database) {
    this.database.exec(CREATE_TABLE_SQL);
    this.database.exec(CREATE_BOOST_TABLE_SQL);
    this.database.exec('PRAGMA journal_mode = OFF');
    this.database.exec('PRAGMA synchronous = OFF');
    this.#insert = this.database.prepare(INSERT_SQL);
    this.#updateBoost = this.database.prepare(UPDATE_BOOST_SQL);
    this.#deleteSession = this.database.prepare(DELETE_SESSION_SQL);
    this.#search = this.database.prepare(SEARCH_SQL);
  }

  indexFile(directory: string, filePath: string, symbols: string, words: string): void {
    this.#insert.run([directory, filePath, symbols, words]);
  }

  /**
   * Boosts the relevance score of a specific file for a given session.
   * @param sessionId - The session identifier to associate the boost with.
   * @param filePath - The path of the file to boost.
   * @param boostFactor - The factor by which to boost the file's relevance.
   */
  boostFile(sessionId: SessionId, filePath: string, boostFactor: number): void {
    this.#updateBoost.run([sessionId, filePath, boostFactor]);
  }

  /**
   * Deletes all data associated with a specific session.
   * @param sessionId - The session identifier to delete data for.
   */
  deleteSession(sessionId: string): void {
    this.#deleteSession.run(sessionId);
  }

  /**
   * Searches for files matching the query, considering session-specific boosts.
   * @param sessionId - The session identifier to apply during the search.
   * @param query - The search query string.
   * @param limit - The maximum number of results to return.
   * @returns An array of search results with directory, file path, and score.
   */
  search(sessionId: SessionId, query: string, limit = 10): FileSearchResult[] {
    const rows = this.#search.all([sessionId, query, limit]) as FileIndexRow[];
    return rows.map((row) => ({
      directory: row.directory,
      filePath: row.file_path,
      score: row.score,
    }));
  }

  close() {
    this.database.close();
  }
}
