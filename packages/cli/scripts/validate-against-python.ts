/* eslint-disable no-console */
//
// Cross-validation script: indexes a fixture set with both the Python
// prototype's importer and the TypeScript port, snapshots both query.db
// files, and diffs them.
//
// Usage:
//   ts-node scripts/validate-against-python.ts
//   APPMAP_APM_DIR=/path/to/appmap-apm ts-node scripts/validate-against-python.ts
//   FIXTURE_DIR=/path/to/recordings  ts-node scripts/validate-against-python.ts
//   KEEP_TMP=1                       ts-node scripts/validate-against-python.ts
//
// Findings are excluded — they are not in scope for the TS port.
// Time-sensitive columns (timestamp, elapsed_ms) are excluded from the
// row-level diff; row counts are still compared.

import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { homedir, tmpdir } from 'os';
import { join } from 'path';

import sqlite3 from 'better-sqlite3';

import { findFiles } from '../src/utils';
import { openQueryDb } from '../src/cmds/query/db';
import { importAppmap } from '../src/cmds/query/db/import/importAppmap';
import { endpoints, EndpointRow } from '../src/cmds/query/queries/endpoints';

const APPMAP_APM_DIR =
  process.env.APPMAP_APM_DIR ?? join(homedir(), 'source', 'appland', 'appmap-apm');
const FIXTURE_DIR =
  process.env.FIXTURE_DIR ?? join(APPMAP_APM_DIR, 'tests', 'fixtures', 'tmp', 'appmap');
const PYTHON = join(APPMAP_APM_DIR, '.venv', 'bin', 'python');

const TABLES = [
  'appmaps',
  'code_objects',
  'labels',
  'http_requests',
  'http_client_requests',
  'sql_queries',
  'function_calls',
  'exceptions',
] as const;

interface Snapshot {
  counts: Record<string, number>;
  rows: Record<string, unknown[]>;
}

function buildPythonDb(fixtureDir: string, dbPath: string): void {
  console.log(`[python] importing ${fixtureDir} → ${dbPath}`);
  execFileSync(PYTHON, ['-m', 'server.cli', 'import', fixtureDir], {
    cwd: APPMAP_APM_DIR,
    env: { ...process.env, APM_DB_PATH: dbPath },
    stdio: 'inherit',
  });
}

async function buildTsDb(fixtureDir: string, dbPath: string): Promise<void> {
  console.log(`[ts] importing ${fixtureDir} → ${dbPath}`);
  const { db } = openQueryDb('/tmp/ignored', dbPath);
  let imported = 0;
  let failed = 0;
  await findFiles(fixtureDir, '.appmap.json', (file: string) => {
    try {
      importAppmap(db, file);
      imported += 1;
    } catch (err) {
      failed += 1;
      console.warn(`  failed: ${file}: ${(err as Error).message}`);
    }
  });
  console.log(`  imported ${imported} (failed=${failed})`);
  db.close();
}

function snapshot(dbPath: string): Snapshot {
  const db = sqlite3(dbPath, { readonly: true });
  try {
    const counts: Record<string, number> = {};
    for (const t of TABLES) {
      counts[t] = (db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n;
    }

    const rows: Record<string, unknown[]> = {};

    rows.appmaps = db
      .prepare(
        `SELECT source_path, language, framework, recorder_type,
                git_repository, git_branch, git_commit,
                event_count, sql_query_count, http_request_count
         FROM appmaps
         ORDER BY source_path`
      )
      .all();

    rows.code_objects = db
      .prepare(`SELECT fqid, defined_class, method_id FROM code_objects ORDER BY fqid`)
      .all();

    rows.labels = db
      .prepare(
        `SELECT co.fqid, l.label
         FROM labels l JOIN code_objects co ON co.id = l.code_object_id
         ORDER BY co.fqid, l.label`
      )
      .all();

    rows.http_requests = db
      .prepare(
        `SELECT a.source_path, h.event_id, h.thread_id, h.parent_event_id,
                h.method, h.path, h.normalized_path, h.protocol,
                h.status_code, h.mime_type
         FROM http_requests h JOIN appmaps a ON a.id = h.appmap_id
         ORDER BY a.source_path, h.event_id`
      )
      .all();

    rows.http_client_requests = db
      .prepare(
        `SELECT a.source_path, h.event_id, h.thread_id, h.parent_event_id,
                h.method, h.url, h.status_code
         FROM http_client_requests h JOIN appmaps a ON a.id = h.appmap_id
         ORDER BY a.source_path, h.event_id`
      )
      .all();

    rows.sql_queries = db
      .prepare(
        `SELECT a.source_path, q.event_id, q.thread_id, q.parent_event_id,
                q.sql_text, q.database_type, q.server_version,
                q.caller_class, q.caller_method
         FROM sql_queries q JOIN appmaps a ON a.id = q.appmap_id
         ORDER BY a.source_path, q.event_id`
      )
      .all();

    rows.function_calls = db
      .prepare(
        `SELECT a.source_path, f.event_id, f.thread_id, f.parent_event_id,
                co.fqid AS code_object_fqid,
                f.defined_class, f.method_id, f.path, f.lineno, f.is_static
         FROM function_calls f
         JOIN appmaps a ON a.id = f.appmap_id
         LEFT JOIN code_objects co ON co.id = f.code_object_id
         ORDER BY a.source_path, f.event_id`
      )
      .all();

    rows.exceptions = db
      .prepare(
        `SELECT a.source_path, e.event_id, e.thread_id, e.parent_event_id,
                e.exception_class, e.message, e.path, e.lineno
         FROM exceptions e JOIN appmaps a ON a.id = e.appmap_id
         ORDER BY a.source_path, e.event_id, e.exception_class`
      )
      .all();

    return { counts, rows };
  } finally {
    db.close();
  }
}

interface Mismatch {
  table: string;
  reason: string;
  details?: { index: number; py: unknown; ts: unknown };
}

// Python equivalent for endpoints uses get_endpoints (count, avg, max, min,
// error_count). We emit it sorted on stable keys so output is deterministic.
const PY_ENDPOINTS_SCRIPT = `
import json, os, sys
from server.services.queries import get_endpoints
rows = get_endpoints(limit=10000)
rows.sort(key=lambda r: (r['method'], r['endpoint']))
print(json.dumps(rows, sort_keys=True))
`;

function pythonEndpoints(dbPath: string): unknown[] {
  const out = execFileSync(PYTHON, ['-c', PY_ENDPOINTS_SCRIPT], {
    cwd: APPMAP_APM_DIR,
    env: { ...process.env, APM_DB_PATH: dbPath },
    encoding: 'utf8',
  });
  return JSON.parse(out) as unknown[];
}

// Round and project a TS EndpointRow to the same shape as Python's
// get_endpoints output, so we can diff them directly. min/max aren't tracked
// by V3's endpoints() — drop them from comparison; they don't affect what
// the verb shows.
function tsEndpointsLikePython(rows: readonly EndpointRow[]) {
  return [...rows]
    .map((r) => ({
      method: r.method,
      endpoint: r.route,
      request_count: r.count,
      avg_elapsed_ms: r.avg_ms == null ? null : Math.round(r.avg_ms * 100) / 100,
      // err_pct (TS) and error_count (Python) are different shapes; reproject:
      error_count: Math.round((r.err_pct / 100) * r.count),
    }))
    .sort((a, b) => (a.method + a.endpoint).localeCompare(b.method + b.endpoint));
}

function diffQueries(pyDb: string, tsDb: string): void {
  console.log('\n--- query layer ---');

  // 1) Python get_endpoints on both DBs — proves query layer is portable.
  const pyOnPy = pythonEndpoints(pyDb);
  const pyOnTs = pythonEndpoints(tsDb);
  const portable =
    JSON.stringify(pyOnPy) === JSON.stringify(pyOnTs) ? 'OK' : 'MISMATCH';
  console.log(`python.get_endpoints(py.db) vs python.get_endpoints(ts.db):  ${portable}`);

  // 2) TS endpoints() on TS DB, projected to Python's shape, against Python's
  // get_endpoints on the same DB. Validates that the V3 verb produces results
  // consistent with the Python query layer for fields they share.
  const db = sqlite3(tsDb, { readonly: true });
  const tsOut = endpoints(db);
  db.close();
  const tsProjected = tsEndpointsLikePython(tsOut);
  const pyOnTsAsArray = pyOnTs as Array<Record<string, unknown>>;
  // Drop fields Python returns that we don't compare (max/min).
  const pyTrimmed = pyOnTsAsArray
    .map((r) => ({
      method: r.method,
      endpoint: r.endpoint,
      request_count: r.request_count,
      avg_elapsed_ms: r.avg_elapsed_ms,
      error_count: r.error_count,
    }))
    .sort((a, b) =>
      String(a.method + a.endpoint).localeCompare(String(b.method + b.endpoint))
    );
  const verbMatch =
    JSON.stringify(tsProjected) === JSON.stringify(pyTrimmed) ? 'OK' : 'MISMATCH';
  console.log(`ts endpoints() vs python.get_endpoints (shared fields):      ${verbMatch}`);
  if (verbMatch !== 'OK') {
    console.log(`  python: ${JSON.stringify(pyTrimmed[0])}`);
    console.log(`  ts:     ${JSON.stringify(tsProjected[0])}`);
  }
}

function diff(py: Snapshot, ts: Snapshot): Mismatch[] {
  const issues: Mismatch[] = [];
  for (const t of TABLES) {
    const pyRows = py.rows[t];
    const tsRows = ts.rows[t];
    if (pyRows.length !== tsRows.length) {
      issues.push({
        table: t,
        reason: `row count differs (python=${pyRows.length}, ts=${tsRows.length})`,
      });
      continue;
    }
    for (let i = 0; i < pyRows.length; i++) {
      const a = JSON.stringify(pyRows[i]);
      const b = JSON.stringify(tsRows[i]);
      if (a !== b) {
        issues.push({
          table: t,
          reason: `first row diff at index ${i}`,
          details: { index: i, py: pyRows[i], ts: tsRows[i] },
        });
        break;
      }
    }
  }
  return issues;
}

async function main(): Promise<void> {
  if (!existsSync(PYTHON)) {
    console.error(`Python interpreter not found at ${PYTHON}`);
    console.error(`Set APPMAP_APM_DIR or install the venv at ${APPMAP_APM_DIR}/.venv`);
    process.exit(2);
  }
  if (!existsSync(FIXTURE_DIR)) {
    console.error(`Fixture dir not found: ${FIXTURE_DIR}`);
    process.exit(2);
  }

  const tmp = mkdtempSync(join(tmpdir(), 'cross-validate-'));
  const pyDb = join(tmp, 'python.db');
  const tsDb = join(tmp, 'ts.db');

  console.log(`fixture dir: ${FIXTURE_DIR}`);
  console.log(`tmp:         ${tmp}\n`);

  buildPythonDb(FIXTURE_DIR, pyDb);
  await buildTsDb(FIXTURE_DIR, tsDb);

  const py = snapshot(pyDb);
  const ts = snapshot(tsDb);

  console.log('\n--- counts ---');
  console.log(`${'table'.padEnd(22)} ${'python'.padStart(8)} ${'ts'.padStart(8)}  ok`);
  let countsOk = true;
  for (const t of TABLES) {
    const match = py.counts[t] === ts.counts[t];
    if (!match) countsOk = false;
    console.log(
      `${t.padEnd(22)} ${String(py.counts[t]).padStart(8)} ${String(ts.counts[t]).padStart(8)}  ${
        match ? 'OK' : 'MISMATCH'
      }`
    );
  }

  const issues = diff(py, ts);
  console.log('\n--- diff ---');
  if (issues.length === 0 && countsOk) {
    console.log('all tables match');
  } else {
    // fall through into the report below
  }
  if (issues.length === 0 && countsOk) {
    diffQueries(pyDb, tsDb);
  } else {
    for (const issue of issues) {
      console.log(`\n${issue.table}: ${issue.reason}`);
      if (issue.details) {
        console.log(`  python: ${JSON.stringify(issue.details.py)}`);
        console.log(`  ts:     ${JSON.stringify(issue.details.ts)}`);
      }
    }
    process.exitCode = 1;
  }

  if (process.env.KEEP_TMP) console.log(`\ntmp dir kept: ${tmp}`);
  else rmSync(tmp, { recursive: true, force: true });
}

void main();
