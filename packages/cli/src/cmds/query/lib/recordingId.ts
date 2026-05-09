// Recording-id helpers shared by the MCP server and the UI server.
//
// The canonical id for a recording is its absolute file path on disk —
// the same value the indexer stored as `appmaps.source_path` (UNIQUE in
// the schema). Names, basenames, numeric ids, and display labels are
// rejected here so consumers get a clear error pointing at the right
// input instead of a silent miss when one of the looser shapes collides.
//
// Extracted from queries/mcp.ts so a second consumer (the local UI HTTP
// server) can resolve and decorate recordings without depending on the
// MCP module.

import sqlite3 from 'better-sqlite3';

import { deriveKind, looksLikeDisplayLabel, RecordingKind } from './appmapPath';
import type { FindAppmapRow } from '../queries/find';
import type { AppmapInfo } from '../queries/tree';

// Resolve an `appmap` argument strictly against the canonical id —
// the absolute source_path returned by find_recordings's `path` field.
// `appmaps.source_path` is UNIQUE, so this resolution is unambiguous.
export function resolveAppmapPath(db: sqlite3.Database, ref: unknown): AppmapInfo {
  const s = String(ref);
  if (looksLikeDisplayLabel(s)) {
    throw new Error(
      `appmap argument looks like a display label. ` +
        `Use the 'path' field from find_recordings instead. Got: '${s}'.`
    );
  }
  const row = db
    .prepare(`SELECT id, name, source_path FROM appmaps WHERE source_path = ?`)
    .get(s) as AppmapInfo | undefined;
  if (row) return row;
  throw new Error(
    `appmap not found at path '${s}'. ` +
      `The appmap argument must be the canonical 'path' field from find_recordings ` +
      `(the absolute file path on disk). Names, basenames, and numeric ids are not accepted.`
  );
}

// Decorate a FindAppmapRow with the canonical id surface (Spec 01):
//   - path  : the absolute source_path — what get_call_tree, find_related,
//             and the --appmap filter expect as input
//   - label : the human-readable name from metadata
//   - kind  : "junit" | "request" | "other" so the UI / agent can pick
//             the right vantage point without guessing from the basename
export function decorateRecording(
  row: FindAppmapRow
): FindAppmapRow & { path: string; label: string; kind: RecordingKind } {
  return {
    ...row,
    path: row.source_path,
    label: row.appmap_name,
    kind: deriveKind(row.source_path),
  };
}
