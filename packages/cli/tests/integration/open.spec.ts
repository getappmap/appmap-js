import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function open(path: string) {
  const result = spawnSync(
    process.execPath,
    ['-r', 'ts-node/register', 'src/cli.ts', 'open', path],
    {
      cwd: join(__dirname, '../..'),
      encoding: 'utf8',
      env: {
        ...process.env,
        TS_NODE_TRANSPILE_ONLY: 'true',
        APPMAP_TELEMETRY_DISABLED: 'true',
        FORCE_COLOR: '0',
      },
      timeout: 15000,
    }
  );
  if (result.error) throw result.error;
  expect(result.status).toBe(1);
  return result.stderr;
}

describe('appmap open', () => {
  let directory: string;
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'appmap-open-'));
  });
  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('reports a missing AppMap', () => {
    const path = join(directory, 'missing.appmap.json');
    expect(open(path)).toContain(`AppMap file ${path} does not exist.`);
  });

  // Mode bits do not deny read access on Windows or to root.
  const itUnprivileged = process.getuid?.() && process.platform !== 'win32' ? it : it.skip;
  itUnprivileged(
    'reports EACCES and the path for an unreadable AppMap, not a missing file',
    async () => {
      const path = join(directory, 'unreadable.appmap.json');
      await writeFile(path, '{}', { mode: 0o000 });
      const stderr = open(path);
      expect(stderr).toContain('EACCES');
      expect(stderr).toContain(path);
      expect(stderr).not.toContain('does not exist');
    }
  );
});
