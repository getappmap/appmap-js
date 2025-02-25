import assert from 'node:assert';
import { warn } from 'node:console';
import { mkdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import cachedir from 'cachedir';
import makeDebug from 'debug';
import sqlite3 from 'node-sqlite3-wasm';

const debug = makeDebug('appmap:search:file-index');

const SCHEMA = `
  CREATE VIRTUAL TABLE IF NOT EXISTS file_content USING fts5(
    directory UNINDEXED,
    file_path,
    file_symbols,
    file_words,
    tokenize = 'porter unicode61'
  );
  CREATE TABLE IF NOT EXISTS file_metadata (
    file_path TEXT PRIMARY KEY,
    directory TEXT NOT NULL,
    generation INTEGER NOT NULL,
    modified INTEGER
  );
  CREATE INDEX file_metadata_generation ON file_metadata (generation);
  CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT
  );`;

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

const SCHEMA_VERSION = '1';

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
  #search: sqlite3.Statement;

  constructor(public database: sqlite3.Database) {
    if (this.schemaVersion !== SCHEMA_VERSION) {
      debug('Schema version mismatch, recreating schema');
      this.dropAllTables();
      this.createSchema();
    }
    this.#search = this.database.prepare(SEARCH_SQL);
  }

  get schemaVersion(): string | undefined {
    try {
      const version = this.database.get("SELECT value FROM metadata WHERE key = 'schema_version'");
      if (!version?.value) return undefined;
      return String(version.value);
    } catch {
      return;
    }
  }

  private createSchema() {
    this.database.exec(SCHEMA);
    this.database.run(
      "INSERT OR REPLACE INTO metadata (key, value) VALUES ('schema_version', ?)",
      SCHEMA_VERSION
    );
  }

  private dropAllTables() {
    this.database.exec(`
      DROP TABLE IF EXISTS file_content;
      DROP TABLE IF EXISTS file_metadata;
      DROP TABLE IF EXISTS metadata;
    `);
  }

  static async cached(kind: string, ...paths: string[]): Promise<FileIndex> {
    const names = paths.map((path) => resolve(path).replace(/[^a-z0-9]/gi, '_')).join('-');
    const name = `index-${kind}-${names}.sqlite`;
    const cacheDir = cachedir('appmap');
    await mkdir(cacheDir, { recursive: true });
    const dbPath = join(cacheDir, name);
    const db = new sqlite3.Database(dbPath);
    debug('Using cached database: %s', dbPath);
    return new FileIndex(db);
  }

  get length(): number {
    const row = this.database.get('SELECT COUNT(*) AS count FROM file_content');
    assert(typeof row?.count === 'number');
    return row.count;
  }

  get path(): string {
    const file = this.database.get('PRAGMA database_list')?.file;
    assert(typeof file === 'string');
    return file || ':memory:';
  }

  clear() {
    this.database.exec(`
      DELETE FROM file_content;
      DELETE FROM file_metadata;
    `);
  }

  async index(
    files: AsyncIterable<{ directory: string; filePath: string }>,
    reader: (filePath: string) => Promise<{ symbols: string[]; words: string[] } | undefined>
  ): Promise<void> {
    const insert = this.database.prepare(
      `INSERT INTO file_content (directory, file_path, file_symbols, file_words) VALUES (?, ?, ?, ?)`
    );
    const update = this.database.prepare(
      `UPDATE file_content SET file_symbols = ?, file_words = ? WHERE directory = ? AND file_path = ?`
    );
    const setMetadata = this.database.prepare(`
      INSERT OR REPLACE INTO file_metadata (file_path, directory, generation, modified)
      VALUES (?, ?, ?, ?)
    `);
    const getMetadata = this.database.prepare(`SELECT * FROM file_metadata WHERE file_path = ?`);
    this.database.exec('BEGIN TRANSACTION');
    const generation = Date.now();
    try {
      for await (const file of files) {
        const { directory, filePath } = file;
        const stats = await stat(filePath).catch(() => undefined);
        const metadata = getMetadata.get(filePath);
        setMetadata.run([filePath, directory, generation, stats?.mtimeMs || null]);
        if (metadata) {
          if (stats && metadata.modified === stats.mtimeMs) {
            debug('Skipping unchanged file: %s', filePath);
            continue;
          } else {
            debug('Updating file: %s', filePath);
          }
        }
        try {
          const content = await reader(filePath);
          if (!content) continue;
          debug('Indexing file: %s', filePath);
          if (metadata) {
            update.run([content.symbols.join(' '), content.words.join(' '), directory, filePath]);
          } else {
            insert.run([directory, filePath, content.symbols.join(' '), content.words.join(' ')]);
          }
        } catch (error) {
          warn('Error indexing file: %s', filePath);
          debug(error);
        }
      }
      this.database.exec(`
        DELETE FROM file_content WHERE file_path IN (SELECT file_path FROM file_metadata WHERE generation <> ${generation});
        DELETE FROM file_metadata WHERE generation <> ${generation};
      `);
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    } finally {
      insert.finalize();
      update.finalize();
      getMetadata.finalize();
    }
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
    this.#search.finalize();
    this.database.close();
  }
}
