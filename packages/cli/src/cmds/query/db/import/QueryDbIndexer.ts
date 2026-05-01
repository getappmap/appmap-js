import { resolve } from 'path';

import sqlite3 from 'better-sqlite3';

import { findFiles } from '../../../../utils';
import { deleteAppmap, importAppmap } from './importAppmap';

// Subscribes to fingerprint pipeline events and routes per-file work into
// the query DB. Owns no policy beyond "import on index, delete on unlink";
// callers wire it up to whichever queue/watcher fits the command shape.
//
// Failure handling: per-file errors (bad JSON, missing fields) are logged
// and skipped; the walk does not abort. DB-level errors still propagate —
// those indicate a real bug, not bad data.

interface IndexEmitter {
  on(event: 'index', listener: (ev: { path: string }) => void): unknown;
}

export class QueryDbIndexer {
  private imported = 0;
  private failed = 0;

  constructor(private readonly db: sqlite3.Database) {}

  // Subscribe to a FingerprintQueue (or anything matching its 'index' event
  // shape) so each successfully fingerprinted file is also imported.
  attach(queue: IndexEmitter): void {
    queue.on('index', (ev) => this.onIndexed(ev.path));
  }

  // Walk a directory and import any .appmap.json that doesn't already have
  // a row in the appmaps table. Bridges the gap when query.db is fresh but
  // fingerprints already exist (so the fingerprinter skips them and never
  // emits an 'index' event for the importer to catch).
  async syncDirectory(directory: string): Promise<void> {
    const present = this.db.prepare('SELECT 1 FROM appmaps WHERE source_path = ?');
    await findFiles(directory, '.appmap.json', (file) => {
      const absolutePath = resolve(file);
      if (!present.get(absolutePath)) this.onIndexed(absolutePath);
    });
  }

  onIndexed(file: string): void {
    try {
      importAppmap(this.db, file);
      this.imported += 1;
    } catch (err) {
      this.failed += 1;
      console.warn(`query db: failed to import ${file}: ${(err as Error).message}`);
    }
  }

  onRemoved(file: string): void {
    try {
      deleteAppmap(this.db, file);
    } catch (err) {
      console.warn(`query db: failed to delete ${file}: ${(err as Error).message}`);
    }
  }

  stats(): { imported: number; failed: number } {
    return { imported: this.imported, failed: this.failed };
  }

  close(): void {
    this.db.close();
  }
}
