import { spawnSync } from 'child_process';
import { join } from 'path';

// cli.ts imports every command module at startup, so each must stay light:
// the code that does the work, with its heavy dependencies, is loaded only
// when the command is dispatched (see lib/lazyHandler). This runs the CLI for
// real and checks which packages were loaded.
//
// If this fails, a command module (or something it imports at the top level)
// has started pulling in one of these packages. Move that import into the
// command's handler module.
const HEAVY_PACKAGES = [
  '@appland/navie',
  '@appland/sequence-diagram',
  '@langchain',
  'better-sqlite3',
  'express',
  'inquirer',
  'jsdom',
  'langchain',
  'mermaid',
];

const packageDir = join(__dirname, '..', '..');

function packagesLoadedBy(...args: string[]): string[] {
  const result = spawnSync(
    process.execPath,
    [
      '-r',
      'ts-node/register',
      '-r',
      join(__dirname, 'support', 'printLoadedModules.js'),
      join(packageDir, 'src', 'cli.ts'),
      ...args,
    ],
    { cwd: packageDir, encoding: 'utf8', env: { ...process.env, TS_NODE_TRANSPILE_ONLY: 'true' } }
  );
  expect(result.status).toBe(0);

  const loaded = result.stderr.split('\n');
  return HEAVY_PACKAGES.filter((name) =>
    loaded.some((path) => path.includes(`/node_modules/${name}/`))
  );
}

describe('CLI startup', () => {
  it('loads no heavy dependencies to print the version', () => {
    expect(packagesLoadedBy('--version')).toEqual([]);
  });

  it("loads no heavy dependencies to print a command's help", () => {
    expect(packagesLoadedBy('navie', '--help')).toEqual([]);
  });
});
