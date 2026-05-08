// Helpers that work with AppMap recording identifiers.
//
// The canonical id for a recording is its absolute file path on disk —
// the same value the indexer stored as `appmaps.source_path`. The path
// is self-documenting — "junit/" / "request_recording/" segments tell
// the agent what kind of trace it is, the basename embeds the test
// method or HTTP route — and an absolute path is unambiguous against
// the index even when a sticky/widened scan accidentally cataloged two
// recordings with the same basename. That orienting metadata is paid
// back many times over by avoiding identifier-form retries (numeric id
// → name → relative path → display label) when the agent re-queries
// the same recording.
//
// Aliases (recording name, basename, numeric id) are not accepted —
// see resolveAppmapPath in queries/mcp.ts. Only the canonical absolute
// path resolves. Names are not unique and numeric ids aren't stable
// across reindexing, so accepting them would be flexibility for
// flexibility's sake — at the cost of agents getting silent-wrong or
// "ambiguous" results when those collisions happen in the wild.

import { sep } from 'path';

const RECORDING_KINDS = {
  junit: 'junit',
  request: 'request',
  other: 'other',
} as const;

export type RecordingKind = (typeof RECORDING_KINDS)[keyof typeof RECORDING_KINDS];

function toForwardSlashes(p: string): string {
  return sep === '\\' ? p.replace(/\\/g, '/') : p;
}

// Categorize the recording by its on-disk location. Junit recordings sit
// in `…/junit/…appmap.json`; per-request slices sit in
// `…/request_recording/…appmap.json`. Any other layout is reported as
// "other" so the field stays present on every row.
export function deriveKind(sourcePath: string): RecordingKind {
  const norm = toForwardSlashes(sourcePath).toLowerCase();
  if (norm.includes('/junit/')) return RECORDING_KINDS.junit;
  if (norm.includes('/request_recording/') || norm.includes('/requests/')) {
    return RECORDING_KINDS.request;
  }
  return RECORDING_KINDS.other;
}

// Display labels — strings of the form "GET /api/v1/payments (200) - 19:47:22.660"
// — sometimes get pasted back as appmap arguments because they're what
// an earlier `find_recordings` *displayed*. They aren't ids; they don't
// match anything in the database. Detect the form here so the caller
// can return a helpful error instead of a silent miss.
const HTTP_METHOD_PREFIX = /^\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\S/i;
const TRAILING_TIMESTAMP = /\s-\s\d{1,2}:\d{2}:\d{2}/;
const PARENS_STATUS = /\(\d{3}\)/;

export function looksLikeDisplayLabel(s: string): boolean {
  if (!s) return false;
  if (TRAILING_TIMESTAMP.test(s)) return true;
  if (HTTP_METHOD_PREFIX.test(s) && PARENS_STATUS.test(s)) return true;
  return false;
}
