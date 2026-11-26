import { execFile } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { readFile } from 'fs/promises';
import type { AppMapComparison } from '@appland/models';
import { ownedFixture, recording } from './support';
const exec = promisify(execFile);
const root = join(__dirname, '../../..');
let fixture: Awaited<ReturnType<typeof ownedFixture>>;
beforeEach(async () => {
  fixture = await ownedFixture();
  await fixture.put(recording([]), recording([{ name: 'added' }]));
});
afterEach(async () => {
  await fixture.clean();
});
describe('Given the compiled public command', () => {
  it('When metadata and help are loaded Then comparison runtime dependencies stay lazy', async () => {
    const script = `const Module = require('module'); const load = Module._load;
      Module._load = function(id, ...args) {
        if (/^@appland\\/(models|sequence-diagram)$/.test(id)) throw Error('eager dependency: ' + id);
        return load.call(this, id, ...args);
      };
      const command = require('./built/cmds/sequenceDiagramCompare');
      require('yargs')([]).command(command).exitProcess(false).parse('sequence-diagram-compare --help');`;
    const result = await exec(process.execPath, ['-e', script], { cwd: root });
    expect(result.stdout).toContain('base-appmap');
  });
  it('When the actual built CLI parses recording arguments Then it writes the expected serialized bundle', async () => {
    await exec(
      process.execPath,
      [
        join(root, 'built/cli.js'),
        'sequence-diagram-compare',
        fixture.base,
        fixture.head,
        '--output-file',
        fixture.output,
        '--scenario',
        'native-entry',
        '--no-loops',
      ],
      { cwd: fixture.dir, env: { ...process.env, APPMAP_TELEMETRY_DISABLED: 'true' } }
    );
    const bundle = JSON.parse(await readFile(fixture.output, 'utf8')) as AppMapComparison;
    expect(bundle.scenario.id).toBe('native-entry');
    expect(bundle.changes.map((c) => c.kind)).toEqual(['call-added']);
  }, 30000);
  it('When the compiled compatibility API is imported Then it produces a real targeted artifact', async () => {
    const command = require(join(
      root,
      'built/cmds/sequenceDiagramCompare'
    )) as typeof import('../../../src/cmds/sequenceDiagramCompare');
    const bundle = await command.buildComparisonBundle(fixture.base, fixture.head);
    expect(bundle.changes.map((c) => c.kind)).toEqual(['call-added']);
    expect(bundle.changes[0].views.sequence?.head?.elementIds).toHaveLength(1);
  });
});
