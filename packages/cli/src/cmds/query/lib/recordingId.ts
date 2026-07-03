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

// Resolve an `appmap` argument against the indexed recordings.
//
// Primary form is the canonical id — the absolute source_path returned
// by find_recordings's `path` field. `appmaps.source_path` is UNIQUE,
// so an exact match is always unambiguous.
//
// Relative paths (anything containing a `/` but not starting with one)
// are also accepted, matched against `source_path` by suffix. The
// indexer already constrains the corpus to configured appmap dirs, so
// a unique suffix match means a single recording — the caller doesn't
// need to plumb absolute paths through. When multiple recordings share
// the suffix, we surface the ambiguity with the candidate paths so
// the caller can pick one.
//
// Bare names, numeric ids, and display labels remain rejected: those
// shapes silently collide in real corpora (multiple recordings share
// the same basename or name), and the resulting wrong-recording
// resolution is harder to debug than an explicit error.
// @label security.path-resolution
export function resolveAppmapPath(db: sqlite3.Database, ref: unknown): AppmapInfo {
  const s = String(ref);
  if (looksLikeDisplayLabel(s)) {
    throw new Error(
      `appmap argument looks like a display label. ` +
        `Use the 'path' field from find_recordings instead. Got: '${s}'.`
    );
  }
  // Exact match on the canonical absolute path (fast path; UNIQUE index).
  const exact = db
    .prepare(`SELECT id, name, source_path FROM appmaps WHERE source_path = ?`)
    .get(s) as AppmapInfo | undefined;
  if (exact) return exact;

  // Relative path: a leading slash is absent, but there's at least one
  // `/` separator so this isn't a bare name. Suffix-match the indexed
  // source_paths; require uniqueness.
  if (!s.startsWith('/') && s.includes('/')) {
    const candidates = db
      .prepare(
        `SELECT id, name, source_path FROM appmaps WHERE source_path LIKE ('%/' || ?)`
      )
      .all(s) as AppmapInfo[];
    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1) {
      const paths = candidates.map((c) => `  ${c.source_path}`).join('\n');
      throw new Error(
        `appmap '${s}' is ambiguous; ${candidates.length} indexed recordings end with that path:\n${paths}\n` +
          `Use the absolute 'path' field from find_recordings to disambiguate.`
      );
    }
  }
  throw new Error(
    `appmap not found at path '${s}'. ` +
      `The appmap argument must be a path that matches an indexed recording — ` +
      `either the canonical absolute 'path' from find_recordings, or a project-` +
      `relative path that uniquely resolves. Bare names and numeric ids are not accepted.`
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
