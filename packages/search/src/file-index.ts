import sqlite3 from 'better-sqlite3';

const CREATE_TABLE_SQL = `CREATE VIRTUAL TABLE file_content USING fts5(
  directory UNINDEXED,
  file_path,
  file_symbols,
  file_words,
  tokenize = 'porter unicode61'
)`;

const CREATE_BOOST_TABLE_SQL = `CREATE TABLE file_boost (
  file_path TEXT PRIMARY KEY,
  boost_factor REAL
)`;

const INSERT_SQL = `INSERT INTO file_content (directory, file_path, file_symbols, file_words)
VALUES (?, ?, ?, ?)`;

const UPDATE_BOOST_SQL = `INSERT OR REPLACE INTO file_boost (file_path, boost_factor)
VALUES (?, ?)`;

const SEARCH_SQL = `SELECT
    file_content.directory,
    file_content.file_path,
    (bm25(file_content, 1)*3.0 + bm25(file_content, 2)*2.0 + bm25(file_content, 3)*1.0)
      * COALESCE(file_boost.boost_factor, 1.0) * -1
      AS score
FROM
    file_content
LEFT JOIN
    file_boost
ON
    file_content.file_path = file_boost.file_path
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
  #search: sqlite3.Statement<[string, number]>;

  constructor(public database: sqlite3.Database) {
    this.database.exec(CREATE_TABLE_SQL);
    this.database.exec(CREATE_BOOST_TABLE_SQL);
    this.database.pragma('journal_mode = OFF');
    this.database.pragma('synchronous = OFF');
    this.#insert = this.database.prepare(INSERT_SQL);
    this.#updateBoost = this.database.prepare(UPDATE_BOOST_SQL);
    this.#search = this.database.prepare(SEARCH_SQL);
  }

  indexFile(directory: string, filePath: string, symbols: string, words: string): void {
    this.#insert.run(directory, filePath, symbols, words);
  }

  boostFile(filePath: string, boostFactor: number): void {
    this.#updateBoost.run(filePath, boostFactor);
  }

  search(query: string, limit = 10): FileSearchResult[] {
    const rows = this.#search.all(query, limit) as FileIndexRow[];
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
