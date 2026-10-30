import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { openQueryDb } from '../../../../../src/cmds/query/db/openQueryDb';
import { runCliFromSource } from '../../../support/runCliFromSource';

// Runs `appmap query mcp` for real and closes its stdin, as an MCP client
// does when it's done. The server must answer and then exit on its own.
// If something starts holding the event loop open (a timer, a socket, a
// watcher), the server's safety net exits with status 1 after a few
// seconds and names what held it, which fails this test with that list.
function runMcp(cwd: string, args: string[], requests: object[]) {
  const result = runCliFromSource(['query', 'mcp', ...args], {
    cwd,
    input: requests.map((r) => JSON.stringify(r) + '\n').join(''),
    // Backstop in case even the safety net doesn't fire.
    timeout: 10_000,
  });
  if (result.status !== 0)
    throw new Error(
      `exited with status ${String(result.status)}, signal ${String(result.signal)}:\n` +
        result.stderr
    );
  return result.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { id: number; result?: any });
}

const findRecordings = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: { name: 'find_recordings', arguments: {} },
};

describe('appmap query mcp process', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'appmap-mcp-process-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('answers and exits when stdin closes, before the index exists', () => {
    const responses = runMcp(tmpDir, ['--query-db', join(tmpDir, 'query.db')], [findRecordings]);
    expect(responses).toHaveLength(1);
    expect(responses[0].result.isError).toBe(true);
  }, 15_000);

  it('answers and exits when stdin closes, with the index open', () => {
    const dbPath = join(tmpDir, 'query.db');
    const { db } = openQueryDb(tmpDir, dbPath);
    db.prepare(
      `INSERT INTO appmaps (name, source_path, git_branch, sql_query_count, elapsed_ms, timestamp)
       VALUES ('rec', '/tmp/rec.appmap.json', 'main', 0, 1, '2026-04-29T12:00:00.000Z')`
    ).run();
    db.close();

    const responses = runMcp(tmpDir, ['--query-db', dbPath], [findRecordings]);
    expect(responses).toHaveLength(1);
    expect(responses[0].result.isError).toBeUndefined();
  }, 15_000);
});
