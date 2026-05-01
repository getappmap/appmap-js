import { createHash } from 'crypto';
import { homedir } from 'os';
import { join, resolve } from 'path';

export const QUERY_DB_FILENAME = 'query.db';
export const QUERY_DB_ENV = 'APPMAP_QUERY_DB';

// Derive the on-disk path for the query DB that corresponds to the given
// appmap directory. The path is rooted at `~/.appmap/data/<sha12>/query.db`,
// where `<sha12>` is the first 12 hex characters of the SHA-256 digest of
// the resolved directory path. Honors APPMAP_QUERY_DB as a full-path
// override.
//
// Pure: returns the path without creating any directories.
export function queryDbPath(appmapDir: string): string {
  const override = process.env[QUERY_DB_ENV];
  if (override) return override;

  const id = createHash('sha256').update(resolve(appmapDir)).digest('hex').slice(0, 12);
  return join(homedir(), '.appmap', 'data', id, QUERY_DB_FILENAME);
}
