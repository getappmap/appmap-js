import { EventEmitter } from 'events';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

import { QueryDbIndexer } from '../../../../../../src/cmds/query/db/import/QueryDbIndexer';
import { freshDb } from './helpers';

function writeAppmap(dir: string, name: string, body: object): string {
  const p = join(dir, name);
  writeFileSync(p, JSON.stringify(body));
  return p;
}

function minimalAppmap(): object {
  return {
    metadata: { timestamp: 1700000000 },
    events: [
      { id: 1, event: 'call', http_server_request: { request_method: 'GET', path_info: '/x' } },
      { id: 2, event: 'return', parent_id: 1, http_server_response: { status_code: 200 } },
    ],
  };
}

describe('QueryDbIndexer', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'qdb-indexer-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('attach() routes index events into importAppmap', () => {
    const db = freshDb();
    const indexer = new QueryDbIndexer(db);
    try {
      const queue = new EventEmitter();
      indexer.attach(queue as any);
      const path = writeAppmap(tmp, 'a.appmap.json', minimalAppmap());
      queue.emit('index', { path });
      expect((db.prepare('SELECT COUNT(*) AS n FROM appmaps').get() as any).n).toBe(1);
      expect(indexer.stats()).toEqual({ imported: 1, failed: 0 });
    } finally {
      // not closing db here — the indexer owns close
      indexer.close();
    }
  });

  it('logs and counts failures without throwing on per-file errors', () => {
    const db = freshDb();
    const indexer = new QueryDbIndexer(db);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const path = join(tmp, 'broken.appmap.json');
      writeFileSync(path, '{not json');
      indexer.onIndexed(path);
      expect(indexer.stats()).toEqual({ imported: 0, failed: 1 });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('failed to import'));
    } finally {
      indexer.close();
      warn.mockRestore();
    }
  });

  it('syncDirectory imports only files not yet in the DB', async () => {
    const db = freshDb();
    const indexer = new QueryDbIndexer(db);
    try {
      const a = writeAppmap(tmp, 'a.appmap.json', minimalAppmap());
      const b = writeAppmap(tmp, 'b.appmap.json', minimalAppmap());
      indexer.onIndexed(a); // pre-import a
      const beforeFailed = indexer.stats().failed;
      const beforeImported = indexer.stats().imported;
      await indexer.syncDirectory(tmp);
      // a was already in DB (skip); b was new (imported).
      expect(indexer.stats().imported).toBe(beforeImported + 1);
      expect(indexer.stats().failed).toBe(beforeFailed);
      const rows = db
        .prepare('SELECT source_path FROM appmaps ORDER BY source_path')
        .all()
        .map((r: any) => r.source_path);
      expect(rows).toEqual([resolve(a), resolve(b)].sort());
    } finally {
      indexer.close();
    }
  });

  it('onRemoved deletes by source_path', () => {
    const db = freshDb();
    const indexer = new QueryDbIndexer(db);
    try {
      const path = writeAppmap(tmp, 'a.appmap.json', minimalAppmap());
      indexer.onIndexed(path);
      expect((db.prepare('SELECT COUNT(*) AS n FROM appmaps').get() as any).n).toBe(1);
      indexer.onRemoved(path);
      expect((db.prepare('SELECT COUNT(*) AS n FROM appmaps').get() as any).n).toBe(0);
    } finally {
      indexer.close();
    }
  });
});
