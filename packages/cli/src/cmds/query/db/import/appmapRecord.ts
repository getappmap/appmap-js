import { statSync } from 'fs';
import { basename } from 'path';

import sqlite3 from 'better-sqlite3';

export interface AppmapMetadata {
  name?: string;
  language?: { name?: string };
  frameworks?: { name?: string }[];
  recorder?: { type?: string };
  git?: { repository?: string; branch?: string; commit?: string };
  timestamp?: number;
  labels?: unknown;
}

export interface ParsedAppmap {
  events?: Record<string, unknown>[];
  metadata?: AppmapMetadata;
  classMap?: unknown;
}

export interface AppmapRecordResult {
  appmapId: number;
  timestampIso: string;
}

// Insert the top-level appmaps row and return its id and resolved timestamp.
//
// Total elapsed is taken from the first return event carrying an
// http_server_response. If metadata.timestamp is missing, falls back to the
// file's mtime so time-range queries still work.
export function insertAppmapRecord(
  db: sqlite3.Database,
  absolutePath: string,
  appmap: ParsedAppmap
): AppmapRecordResult {
  const events = appmap.events ?? [];
  const metadata = appmap.metadata ?? {};

  let totalElapsedMs: number | null = null;
  for (const ev of events) {
    if (ev.event === 'return' && 'http_server_response' in ev) {
      const elapsed = ev.elapsed;
      if (typeof elapsed === 'number') totalElapsedMs = elapsed * 1000;
      break;
    }
  }

  let sqlQueryCount = 0;
  let httpRequestCount = 0;
  for (const ev of events) {
    if ('sql_query' in ev) sqlQueryCount += 1;
    if ('http_server_request' in ev) httpRequestCount += 1;
  }

  const language = metadata.language?.name ?? null;
  const framework = metadata.frameworks?.[0]?.name ?? null;
  const recorderType = metadata.recorder?.type ?? null;
  const git = metadata.git ?? {};

  let timestampIso: string;
  if (typeof metadata.timestamp === 'number') {
    timestampIso = new Date(metadata.timestamp * 1000).toISOString();
  } else {
    timestampIso = statSync(absolutePath).mtime.toISOString();
  }

  const labels = metadata.labels;
  const metadataLabelsJson = labels ? JSON.stringify(labels) : null;
  const name = metadata.name ?? basename(absolutePath);

  const info = db
    .prepare(
      `INSERT INTO appmaps (name, source_path, language, framework, recorder_type,
        git_repository, git_branch, git_commit, timestamp,
        event_count, sql_query_count, http_request_count, elapsed_ms,
        metadata_labels)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      name,
      absolutePath,
      language,
      framework,
      recorderType,
      git.repository ?? null,
      git.branch ?? null,
      git.commit ?? null,
      timestampIso,
      events.length,
      sqlQueryCount,
      httpRequestCount,
      totalElapsedMs,
      metadataLabelsJson
    );

  return { appmapId: Number(info.lastInsertRowid), timestampIso };
}
