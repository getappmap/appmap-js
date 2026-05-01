import { mkdirSync } from 'fs';
import { dirname } from 'path';

import sqlite3 from 'better-sqlite3';

import { SCHEMA, SCHEMA_TABLES, SCHEMA_VERSION } from './schema';
import { queryDbPath } from './path';

export interface OpenQueryDbResult {
  db: sqlite3.Database;
  path: string;
  version: number;
  rebuilt: boolean;
}

// Open the query DB for the given appmap directory, ensuring its schema is
// at SCHEMA_VERSION. Creates the parent directory and the file if missing.
// Drops and rebuilds all schema tables if the on-disk version doesn't match.
//
// `dbPath` overrides path derivation (used by tests).
export function openQueryDb(appmapDir: string, dbPath?: string): OpenQueryDbResult {
  const path = dbPath ?? queryDbPath(appmapDir);
  mkdirSync(dirname(path), { recursive: true });

  const db = sqlite3(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  const currentVersion = db.pragma('user_version', { simple: true }) as number;
  let rebuilt = false;

  if (currentVersion === 0) {
    db.exec(SCHEMA);
    db.pragma(`user_version = ${SCHEMA_VERSION}`);
  } else if (currentVersion !== SCHEMA_VERSION) {
    rebuildSchema(db);
    rebuilt = true;
  }

  return { db, path, version: SCHEMA_VERSION, rebuilt };
}

function rebuildSchema(db: sqlite3.Database): void {
  const tx = db.transaction(() => {
    db.pragma('foreign_keys = OFF');
    for (const table of SCHEMA_TABLES) {
      db.exec(`DROP TABLE IF EXISTS ${table}`);
    }
    db.exec(SCHEMA);
    db.pragma(`user_version = ${SCHEMA_VERSION}`);
    db.pragma('foreign_keys = ON');
  });
  tx();
}
