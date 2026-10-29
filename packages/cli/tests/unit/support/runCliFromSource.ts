import { spawnSync, SpawnSyncReturns } from 'child_process';
import { join } from 'path';

const packageDir = join(__dirname, '..', '..', '..');

export interface RunCliOptions {
  cwd?: string;
  input?: string;
  // Extra modules to preload, e.g. to observe the process from inside.
  preload?: string[];
  // Milliseconds before the process is killed with SIGTERM.
  timeout?: number;
}

// Runs src/cli.ts in a separate node process, as the real CLI would run.
export function runCliFromSource(
  args: string[],
  { cwd = packageDir, input, preload = [], timeout }: RunCliOptions = {}
): SpawnSyncReturns<string> {
  return spawnSync(
    process.execPath,
    [
      // Resolved here: `-r` looks a bare name up from the cwd.
      '-r',
      require.resolve('ts-node/register'),
      ...preload.flatMap((path) => ['-r', path]),
      join(packageDir, 'src', 'cli.ts'),
      ...args,
    ],
    {
      cwd,
      input,
      timeout,
      encoding: 'utf8',
      env: { ...process.env, TS_NODE_TRANSPILE_ONLY: 'true', APPMAP_TELEMETRY_DISABLED: '1' },
    }
  );
}
