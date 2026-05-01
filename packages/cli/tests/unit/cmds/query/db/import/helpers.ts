import sqlite3 from 'better-sqlite3';

import { openQueryDb } from '../../../../../../src/cmds/query/db/openQueryDb';

// Open an in-memory query DB with the schema applied.
export function freshDb(): sqlite3.Database {
  return openQueryDb('/tmp/ignored', ':memory:').db;
}
