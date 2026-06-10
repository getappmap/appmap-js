import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { insertAppmapRecord } from '../../../../../../src/cmds/query/db/import/appmapRecord';
import { freshDb } from './helpers';

describe('insertAppmapRecord', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'appmap-record-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('inserts a row with derived metadata, counts, and elapsed', () => {
    const db = freshDb();
    try {
      const path = join(tmp, 'test.appmap.json');
      writeFileSync(path, '{}');

      const result = insertAppmapRecord(db, path, {
        events: [
          { id: 1, event: 'call', http_server_request: { request_method: 'GET' } },
          { id: 2, event: 'return', parent_id: 1, http_server_response: { status_code: 200 }, elapsed: 0.42 },
          { id: 3, event: 'call', sql_query: { sql: 'SELECT 1' } },
          { id: 4, event: 'return', parent_id: 3 },
        ],
        metadata: {
          name: 'demo',
          language: { name: 'ruby' },
          frameworks: [{ name: 'rails' }],
          recorder: { type: 'rspec' },
          git: { repository: 'r', branch: 'main', commit: 'abc' },
          timestamp: 1700000000,
          labels: ['lab1', 'lab2'],
        },
      });

      expect(result.appmapId).toBe(1);
      expect(result.timestampIso).toBe(new Date(1700000000 * 1000).toISOString());

      const row = db.prepare('SELECT * FROM appmaps WHERE id = ?').get(result.appmapId) as any;
      expect(row.name).toBe('demo');
      expect(row.source_path).toBe(path);
      expect(row.language).toBe('ruby');
      expect(row.framework).toBe('rails');
      expect(row.recorder_type).toBe('rspec');
      expect(row.git_repository).toBe('r');
      expect(row.git_branch).toBe('main');
      expect(row.git_commit).toBe('abc');
      expect(row.event_count).toBe(4);
      expect(row.sql_query_count).toBe(1);
      expect(row.http_request_count).toBe(1);
      expect(row.elapsed_ms).toBeCloseTo(420);
      expect(JSON.parse(row.metadata_labels)).toEqual(['lab1', 'lab2']);
    } finally {
      db.close();
    }
  });

  it('falls back to file mtime when metadata has no timestamp', () => {
    const db = freshDb();
    try {
      const path = join(tmp, 'no-ts.appmap.json');
      writeFileSync(path, '{}');
      const result = insertAppmapRecord(db, path, { events: [], metadata: {} });
      // Just assert it parses as a valid date.
      expect(Number.isNaN(Date.parse(result.timestampIso))).toBe(false);
    } finally {
      db.close();
    }
  });

  it('uses the file basename as the name when metadata.name is missing', () => {
    const db = freshDb();
    try {
      const path = join(tmp, 'unnamed.appmap.json');
      writeFileSync(path, '{}');
      insertAppmapRecord(db, path, { events: [], metadata: {} });
      const row = db.prepare('SELECT name FROM appmaps').get() as any;
      expect(row.name).toBe('unnamed.appmap.json');
    } finally {
      db.close();
    }
  });

  it('leaves elapsed_ms null when there is no http_server_response return', () => {
    const db = freshDb();
    try {
      const path = join(tmp, 'no-http.appmap.json');
      writeFileSync(path, '{}');
      insertAppmapRecord(db, path, {
        events: [{ id: 1, event: 'call' }],
        metadata: { timestamp: 1700000000 },
      });
      const row = db.prepare('SELECT elapsed_ms FROM appmaps').get() as any;
      expect(row.elapsed_ms).toBeNull();
    } finally {
      db.close();
    }
  });
});
