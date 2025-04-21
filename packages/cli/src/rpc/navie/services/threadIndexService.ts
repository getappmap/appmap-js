import sqlite3 from 'node-sqlite3-wasm';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import configuration from '../../configuration';
import { container, inject, injectable, singleton } from 'tsyringe';
import { mkdir } from 'node:fs/promises';
import { lock } from 'proper-lockfile';
import { isNativeError } from 'node:util/types';

const SCHEMA_VERSION = 1;

const INITIALIZE_SESSION_SQL = `
PRAGMA busy_timeout = 3000;
PRAGMA foreign_keys = ON;
`;

const INITIALIZE_DB_SQL = `
CREATE TABLE IF NOT EXISTS threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  path TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uuid_format CHECK (length(uuid) = 36)
);

CREATE INDEX IF NOT EXISTS idx_created_at ON threads (created_at);
CREATE INDEX IF NOT EXISTS idx_uuid ON threads (uuid);

CREATE TABLE IF NOT EXISTS project_directories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  FOREIGN KEY(thread_id) REFERENCES threads(uuid) ON DELETE CASCADE,
  UNIQUE (thread_id, path)
);

CREATE INDEX IF NOT EXISTS idx_thread_id ON project_directories (thread_id);

PRAGMA user_version = ${SCHEMA_VERSION};
`;

const QUERY_INSERT_THREAD_SQL = `INSERT INTO threads (uuid, path, title) VALUES (?, ?, ?)
ON CONFLICT (uuid) DO UPDATE SET updated_at = CURRENT_TIMESTAMP, title = ?`;
const QUERY_DELETE_THREAD_SQL = `DELETE FROM threads WHERE uuid = ?`;
const QUERY_INSERT_PROJECT_DIRECTORY_SQL = `INSERT INTO project_directories (thread_id, path) VALUES (?, ?)
ON CONFLICT (thread_id, path) DO NOTHING`;

interface QueryOptions {
  uuid?: string;
  maxCreatedAt?: Date;
  orderBy?: 'created_at' | 'updated_at' | 'title';
  limit?: number;
  offset?: number;
  projectDirectories?: string[];
}

export interface ThreadIndexItem {
  id: string;
  path: string;
  title: string;
  created_at: string;
  updated_at: string;
}

/**
 * A service for managing the conversation thread index. The thread index is a SQLite database that
 * stores information about threads, such as their path and title.
 */
@singleton()
@injectable()
export class ThreadIndexService {
  static readonly MIGRATION_RETRIES = 5;
  static readonly DEFAULT_DATABASE_PATH = join(homedir(), '.appmap', 'navie', 'thread-index.db');
  static readonly DATABASE = 'ThreadIndexDatabase';

  constructor(@inject(ThreadIndexService.DATABASE) private readonly db: sqlite3.Database) {
    this.db.exec(INITIALIZE_SESSION_SQL);
  }

  private shouldMigrate(): boolean {
    const currentVersion = this.db.get('PRAGMA user_version')?.user_version;
    return currentVersion !== SCHEMA_VERSION;
  }

  /**
   * Migrates the database schema to the latest version. This should be called upon application
   * initialization to ensure that the database is up to date.
   */
  public async migrate(databaseFilePath = ThreadIndexService.DEFAULT_DATABASE_PATH) {
    if (!this.shouldMigrate()) return;

    let lockRelease: (() => Promise<void>) | undefined;
    try {
      await mkdir(dirname(databaseFilePath), { recursive: true });

      lockRelease = await lock(databaseFilePath, {
        retries: ThreadIndexService.MIGRATION_RETRIES,
        stale: 10000,
        lockfilePath: `${databaseFilePath}.migration.lock`,
      });

      if (!this.shouldMigrate()) {
        console.info('ThreadIndexService: migration completed by another process');
        return;
      }

      console.info(`ThreadIndexService: migrating schema to v${SCHEMA_VERSION}`);
      try {
        this.db.exec('PRAGMA journal_mode = WAL');
        this.db.exec('BEGIN TRANSACTION');
        this.db.exec(INITIALIZE_DB_SQL);
        this.db.exec('COMMIT');
        console.info(`ThreadIndexService: successfully migrated schema to v${SCHEMA_VERSION}`);
        return;
      } catch (e) {
        this.db.exec('ROLLBACK');
        throw e;
      }
    } finally {
      if (lockRelease) {
        await lockRelease();
      }
    }
  }

  /**
   * Binds the database to a sqlite3 instance on disk at the default database path
   */
  static async useDefault() {
    await mkdir(dirname(this.DEFAULT_DATABASE_PATH), { recursive: true });

    const db = new sqlite3.Database(this.DEFAULT_DATABASE_PATH);
    container.registerInstance(this.DATABASE, db);

    await container.resolve(ThreadIndexService).migrate();
  }

  /**
   * Indexes a thread with the given path and title. If the thread is already indexed, it will be
   * updated.
   *
   * @param threadId The thread ID
   * @param path The path to the thread
   * @param title The title of the thread
   */
  index(threadId: string, path: string, title?: string) {
    const { projectDirectories } = configuration();
    try {
      this.db.exec('BEGIN TRANSACTION');
      this.db.run(QUERY_INSERT_THREAD_SQL, [threadId, path, title ?? null, title ?? null]);

      // Project directories are written on every index update.
      //
      // This is likely not necessary but it'll handle the edge case where an additional project
      // directory is added mid-way through a conversation.
      const queryInsertProjectDirectory = this.db.prepare(QUERY_INSERT_PROJECT_DIRECTORY_SQL);
      projectDirectories.forEach((projectDirectory) => {
        queryInsertProjectDirectory.run([threadId, projectDirectory]);
      });
      queryInsertProjectDirectory.finalize();
      this.db.exec('COMMIT');
    } catch (e) {
      this.db.exec('ROLLBACK');
      console.error('Failed to index thread', threadId, path, title, e);
    }
    return;
  }

  /**
   * Deletes a thread from the index.
   *
   * @param threadId The thread ID
   */
  delete(threadId: string) {
    return this.db.run(QUERY_DELETE_THREAD_SQL, threadId);
  }

  /**
   * Queries the index for threads.
   *
   * @param options The options to query with
   * @returns The threads that match the query
   */
  query(options: QueryOptions): ThreadIndexItem[] {
    let queryString = `SELECT uuid as id, threads.path, title, created_at, updated_at FROM threads`;
    const params: sqlite3.JSValue[] = [];
    if (options.uuid) {
      queryString += ` WHERE uuid = ?`;
      params.push(options.uuid);
    }
    if (options.maxCreatedAt) {
      const appendKeyword = queryString.includes('WHERE') ? 'AND' : 'WHERE';
      queryString += ` ${appendKeyword} created_at > ?`;
      params.push(options.maxCreatedAt.toISOString());
    }
    if (options.orderBy) {
      if (!['created_at', 'updated_at', 'title'].includes(options.orderBy)) {
        throw new Error(`invalid orderBy option: ${options.orderBy}`);
      }
      // Note that this parameter is not escaped. It's validated directly above.
      queryString += ` ORDER BY threads.${options.orderBy} DESC`;
    }
    if (options.limit) {
      queryString += ` LIMIT ?`;
      params.push(options.limit);
    }
    if (options.offset) {
      if (!Number.isInteger(options.limit)) {
        throw new Error(`offset cannot be used without a limit`);
      }
      queryString += ` OFFSET ?`;
      params.push(options.offset);
    }
    if (options.projectDirectories) {
      if (options.projectDirectories.length === 0) {
        // If `projectDirectories` is an empty array, we want to return all threads that have no
        // project directories associated with them. This is edge-casey, but this does occur in
        // development.
        //
        // If you're looking to query for threads with any project directory, leave `projectDirectories`
        // as `undefined`.
        queryString += ` LEFT JOIN project_directories ON uuid = thread_id WHERE project_directories.path IS NULL`;
      } else {
        queryString += ` INNER JOIN project_directories ON uuid = thread_id WHERE project_directories.path IN (${options.projectDirectories
          .map(() => '?')
          .join(',')})`;
        params.push(...options.projectDirectories);
      }
    }
    return this.db.all(queryString, params) as unknown as ThreadIndexItem[];
  }
}
