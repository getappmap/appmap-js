import { readFileSync } from 'fs';
import { resolve } from 'path';

import sqlite3 from 'better-sqlite3';

import { insertAppmapRecord, ParsedAppmap } from './appmapRecord';
import { importCodeObjects, ClassMapNode } from './codeObjects';
import { importHttpRequests } from './httpRequests';
import { importHttpClientRequests } from './httpClientRequests';
import { importSqlQueries } from './sqlQueries';
import { importFunctionCalls } from './functionCalls';
import { importExceptions } from './exceptions';
import { buildParentEventMap } from './parentEventMap';
import { buildReturnEventMap } from './returnEventMap';

export interface ImportResult {
  appmapId: number;
  eventCount: number;
  sqlCount: number;
  httpCount: number;
}

// Idempotency: existing rows for this source_path are dropped (FK cascade
// clears child rows) before re-inserting. The whole import runs in one
// transaction — partial state is never visible to readers.
export function importAppmap(db: sqlite3.Database, filePath: string): ImportResult {
  const absolutePath = resolve(filePath);
  const raw = readFileSync(absolutePath, 'utf8');
  const parsed = JSON.parse(raw) as ParsedAppmap & { classMap?: ClassMapNode[] };
  const events = parsed.events ?? [];
  const classMap = parsed.classMap ?? [];

  const tx = db.transaction((): ImportResult => {
    db.prepare('DELETE FROM appmaps WHERE source_path = ?').run(absolutePath);

    const { appmapId, timestampIso } = insertAppmapRecord(db, absolutePath, parsed);
    const codeObjectLookup = importCodeObjects(db, classMap);

    const returnEvents = buildReturnEventMap(events);
    const parentEventMap = buildParentEventMap(events);

    importHttpRequests(db, appmapId, events, returnEvents, parentEventMap, timestampIso);
    importHttpClientRequests(db, appmapId, events, returnEvents, parentEventMap);
    importSqlQueries(db, appmapId, events, returnEvents, parentEventMap);
    importFunctionCalls(db, appmapId, events, returnEvents, parentEventMap, codeObjectLookup);
    importExceptions(db, appmapId, events, parentEventMap);

    let sqlCount = 0;
    let httpCount = 0;
    for (const ev of events) {
      if ('sql_query' in ev) sqlCount += 1;
      if ('http_server_request' in ev) httpCount += 1;
    }

    return { appmapId, eventCount: events.length, sqlCount, httpCount };
  });

  return tx();
}

// Drop all rows for the given recording. ON DELETE CASCADE removes child
// rows from http_requests, sql_queries, function_calls, exceptions, etc.
export function deleteAppmap(db: sqlite3.Database, filePath: string): boolean {
  const absolutePath = resolve(filePath);
  const info = db.prepare('DELETE FROM appmaps WHERE source_path = ?').run(absolutePath);
  return info.changes > 0;
}
