import type sqlite3 from 'node-sqlite3-wasm';

const CREATE_TABLE_SQL = `CREATE VIRTUAL TABLE file_content USING fts5(
  directory UNINDEXED,
  file_path,
  file_symbols,
  file_words,
  tokenize = 'porter unicode61'
)`;

const INSERT_SQL = `INSERT INTO file_content (directory, file_path, file_symbols, file_words)
VALUES (?, ?, ?, ?)`;

const SEARCH_SQL = `SELECT
    file_content.directory,
    file_content.file_path,
    -- directory, file_path, file_symbols, file_words
    -bm25(file_content, 0, 3, 2, 1)
      AS score
FROM
    file_content
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
 * 2. Performing search queries on the indexed files using full-text search with BM25 ranking. The search results are
 *    influenced by the indexed content.
 *
 * The class uses two SQLite tables:
 * - `file_content`: A virtual table that holds the file content and allows for full-text search using BM25 ranking.
 */
export default class FileIndex {
  #insert: sqlite3.Statement;
  #search: sqlite3.Statement;

  constructor(public database: sqlite3.Database) {
    this.database.exec(CREATE_TABLE_SQL);
    this.database.exec('PRAGMA journal_mode = OFF');
    this.database.exec('PRAGMA synchronous = OFF');
    this.#insert = this.database.prepare(INSERT_SQL);
    this.#search = this.database.prepare(SEARCH_SQL);
  }

  indexFile(directory: string, filePath: string, symbols: string, words: string): void {
    this.#insert.run([directory, filePath, symbols, words]);
  }

  /**
   * Searches for files matching the query.
   * @param query - The search query string.
   * @param limit - The maximum number of results to return.
   * @returns An array of search results with directory, file path, and score.
   */
  search(query: string, limit = 10): FileSearchResult[] {
    const rows = this.#search.all([query, limit]) as FileIndexRow[];
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
