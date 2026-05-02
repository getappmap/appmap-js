import { createHash } from 'crypto';
import { homedir } from 'os';
import { join, resolve } from 'path';

export const QUERY_DB_FILENAME = 'query.db';

// Derive the on-disk path for the query DB that corresponds to the given
// appmap directory. The path is rooted at `~/.appmap/data/<sha12>/query.db`,
// where `<sha12>` is the first 12 hex characters of the SHA-256 digest of
// the resolved directory path.
//
// Pure: returns the path without creating any directories.
//
// To use a different path (tests, CI, demo scripts), call openQueryDb /
// openReadOnly with an explicit `dbPath` argument; the corresponding CLI
// flag is `--db`.
export function queryDbPath(appmapDir: string): string {
  const id = createHash('sha256').update(resolve(appmapDir)).digest('hex').slice(0, 12);
  return join(homedir(), '.appmap', 'data', id, QUERY_DB_FILENAME);
}
