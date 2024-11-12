import assert from 'assert';
import sqlite3 from 'better-sqlite3';

const CREATE_SNIPPET_CONTENT_TABLE_SQL = `CREATE VIRTUAL TABLE snippet_content USING fts5(
  snippet_id UNINDEXED,
  directory UNINDEXED,
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
(snippet_id, directory, file_symbols, file_words, content)
VALUES (?, ?, ?, ?, ?)`;

const UPDATE_SNIPPET_BOOST_SQL = `INSERT OR REPLACE INTO snippet_boost 
(snippet_id, boost_factor)
VALUES (?, ?)`;

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
WHERE
  snippet_content MATCH ?
ORDER BY
  score DESC
LIMIT ?`;

export type SnippetId = {
  type: string;
  id: string;
};

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
    snippetId: SnippetId,
    directory: string,
    symbols: string,
    words: string,
    content: string
  ): void {
    this.#insertSnippet.run(encodeSnippetId(snippetId), directory, symbols, words, content);
  }

  boostSnippet(snippetId: SnippetId, boostFactor: number): void {
    this.#updateSnippetBoost.run(encodeSnippetId(snippetId), boostFactor);
  }

  searchSnippets(query: string, limit = 10): SnippetSearchResult[] {
    const rows = this.#searchSnippet.all(query, limit) as SnippetSearchRow[];
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
