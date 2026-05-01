import { existsSync } from 'fs';

import sqlite3 from 'better-sqlite3';

import { queryDbPath } from '../db/path';

// Open the query DB read-only for the given appmap directory.
// Errors if the DB doesn't exist, prompting the user to run `appmap index`.
// `dbPath` overrides path derivation (used by tests and the --db flag).
export function openReadOnly(appmapDir: string, dbPath?: string): sqlite3.Database {
  const path = dbPath ?? queryDbPath(appmapDir);
  if (!existsSync(path)) {
    throw new Error(
      `query DB not found at ${path}\nRun \`appmap index\` first to build it.`
    );
  }
  const db = sqlite3(path, { readonly: true });

  // Make sure we don't error out on locked DBs (e.g. if the user tries to query
  // while `appmap index` is running). The query will just wait until the lock is released.
  db.pragma('busy_timeout = 5000');
  return db;
}
