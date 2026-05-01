import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { openQueryDb } from '../../../../../src/cmds/query/db/openQueryDb';
import { SCHEMA_TABLES, SCHEMA_VERSION } from '../../../../../src/cmds/query/db/schema';

describe('openQueryDb', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'appmap-query-db-'));
    dbPath = join(tmpDir, 'query.db');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates all schema tables on a fresh DB and stamps user_version', () => {
    const { db, version, rebuilt, path } = openQueryDb('/tmp/ignored', dbPath);
    try {
      expect(path).toBe(dbPath);
      expect(version).toBe(SCHEMA_VERSION);
      expect(rebuilt).toBe(false);

      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all()
        .map((r: any) => r.name);
      for (const t of SCHEMA_TABLES) expect(tables).toContain(t);

      expect(db.pragma('user_version', { simple: true })).toBe(SCHEMA_VERSION);
    } finally {
      db.close();
    }
  });

  it('reopens an existing DB at the same version without rebuilding', () => {
    const first = openQueryDb('/tmp/ignored', dbPath);
    first.db.exec("INSERT INTO appmaps (name, source_path) VALUES ('canary', '/tmp/canary')");
    first.db.close();

    const second = openQueryDb('/tmp/ignored', dbPath);
    try {
      expect(second.rebuilt).toBe(false);
      const row = second.db
        .prepare("SELECT name FROM appmaps WHERE source_path = '/tmp/canary'")
        .get() as { name: string } | undefined;
      expect(row?.name).toBe('canary');
    } finally {
      second.db.close();
    }
  });

  it('drops and rebuilds tables when on-disk user_version does not match', () => {
    const first = openQueryDb('/tmp/ignored', dbPath);
    first.db.exec("INSERT INTO appmaps (name, source_path) VALUES ('canary', '/tmp/canary')");
    first.db.pragma('user_version = 999');
    first.db.close();

    const second = openQueryDb('/tmp/ignored', dbPath);
    try {
      expect(second.rebuilt).toBe(true);
      expect(second.version).toBe(SCHEMA_VERSION);
      const count = second.db.prepare('SELECT COUNT(*) AS n FROM appmaps').get() as { n: number };
      expect(count.n).toBe(0);
      expect(second.db.pragma('user_version', { simple: true })).toBe(SCHEMA_VERSION);
    } finally {
      second.db.close();
    }
  });

  it('enables WAL and foreign_keys pragmas', () => {
    const { db } = openQueryDb('/tmp/ignored', dbPath);
    try {
      expect(String(db.pragma('journal_mode', { simple: true })).toLowerCase()).toBe('wal');
      expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
    } finally {
      db.close();
    }
  });

  it('cascades deletes from appmaps to dependent rows', () => {
    const { db } = openQueryDb('/tmp/ignored', dbPath);
    try {
      const info = db
        .prepare("INSERT INTO appmaps (name, source_path) VALUES (?, ?)")
        .run('rec', '/tmp/rec.appmap.json');
      const appmapId = info.lastInsertRowid;

      db.prepare(
        `INSERT INTO http_requests
         (appmap_id, event_id, method, path, status_code)
         VALUES (?, 1, 'GET', '/x', 200)`
      ).run(appmapId);

      db.prepare('DELETE FROM appmaps WHERE id = ?').run(appmapId);

      const remaining = db
        .prepare('SELECT COUNT(*) AS n FROM http_requests WHERE appmap_id = ?')
        .get(appmapId) as { n: number };
      expect(remaining.n).toBe(0);
    } finally {
      db.close();
    }
  });

  it('creates the parent directory when it does not exist', () => {
    const nested = join(tmpDir, 'a', 'b', 'c', 'query.db');
    const { db } = openQueryDb('/tmp/ignored', nested);
    try {
      expect(db.pragma('user_version', { simple: true })).toBe(SCHEMA_VERSION);
    } finally {
      db.close();
    }
  });
});
