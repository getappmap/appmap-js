import sqlite3 from 'better-sqlite3';
import { warn } from 'console';

const CREATE_SNIPPET_CONTENT_TABLE_SQL = `CREATE VIRTUAL TABLE snippet_content USING fts5(
  snippet_id UNINDEXED,
  directory UNINDEXED,
  file_path,
  start_line UNINDEXED,
  end_line UNINDEXED, 
  file_symbols,
  file_words,
  content UNINDEXED,
  tokenize = 'porter unicode61'
)`;

const CREATE_SNIPPET_BOOST_TABLE_SQL = `CREATE TABLE snippet_boost (
  snippet_id TEXT PRIMARY KEY,
  boost_factor REAL
)`;

const INSERT_SNIPPET_SQL = `INSERT INTO snippet_content 
(snippet_id, directory, file_path, start_line, end_line, file_symbols, file_words, content)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

const UPDATE_SNIPPET_BOOST_SQL = `INSERT OR REPLACE INTO snippet_boost 
(snippet_id, boost_factor)
VALUES (?, ?)`;

const SEARCH_SNIPPET_SQL = `SELECT
  snippet_content.directory,
  snippet_content.file_path,
  snippet_content.start_line,
  snippet_content.end_line,
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
WHERE
  snippet_content MATCH ?
ORDER BY
  score DESC
LIMIT ?`;

export type SnippetSearchResult = {
  snippetId: string;
  directory: string;
  filePath: string;
  startLine: number | undefined;
  endLine: number | undefined;
  score: number;
  content: string;
};

export default class SnippetIndex {
  #insertSnippet: sqlite3.Statement;
  #updateSnippetBoost: sqlite3.Statement;
  #searchSnippet: sqlite3.Statement<[string, number]>;

  constructor(public database: sqlite3.Database) {
    this.database.exec(CREATE_SNIPPET_CONTENT_TABLE_SQL);
    this.database.exec(CREATE_SNIPPET_BOOST_TABLE_SQL);
    this.database.pragma('journal_mode = OFF');
    this.database.pragma('synchronous = OFF');
    this.#insertSnippet = this.database.prepare(INSERT_SNIPPET_SQL);
    this.#updateSnippetBoost = this.database.prepare(UPDATE_SNIPPET_BOOST_SQL);
    this.#searchSnippet = this.database.prepare(SEARCH_SNIPPET_SQL);
  }

  indexSnippet(
    snippetId: string,
    directory: string,
    filePath: string,
    startLine: number | undefined,
    endLine: number | undefined,
    symbols: string,
    words: string,
    content: string
  ): void {
    this.#insertSnippet.run(
      snippetId,
      directory,
      filePath,
      startLine,
      endLine,
      symbols,
      words,
      content
    );
  }

  boostSnippet(snippetId: string, boostFactor: number): void {
    this.#updateSnippetBoost.run(snippetId, boostFactor);
  }

  searchSnippets(query: string, limit = 10): SnippetSearchResult[] {
    const rows = this.#searchSnippet.all(query, limit) as any[];
    return rows.map((row) => ({
      directory: row.directory,
      snippetId: row.snippet_id,
      filePath: row.file_path,
      startLine: row.start_line,
      endLine: row.end_line,
      score: row.score,
      content: row.content,
    }));
  }

  close() {
    this.database.close();
  }
}
