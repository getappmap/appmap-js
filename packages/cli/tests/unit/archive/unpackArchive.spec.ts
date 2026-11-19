import { mkdir, mkdtemp, rm, symlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { confinedPath } from '../../../src/cmds/archive/unpackArchive';

describe('unpackArchive.confinedPath', () => {
  let root: string;
  let outputDir: string;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'appmap-unpack-'));
    outputDir = join(root, 'output');
    await mkdir(join(outputDir, 'sub'), { recursive: true });
    await mkdir(join(root, 'elsewhere'));
    await symlink(join(root, 'elsewhere'), join(outputDir, 'escape'));
  });

  afterAll(() => rm(root, { recursive: true, force: true }));

  it('accepts a path inside the output directory', async () => {
    await expect(confinedPath(outputDir, 'sub/a.appmap.json')).resolves.toMatch(
      /output\/sub\/a\.appmap\.json$/
    );
  });

  it('rejects a path that climbs out with ..', async () => {
    await expect(confinedPath(outputDir, '../victim.txt')).rejects.toThrow(/outside/);
  });

  it('rejects an absolute path', async () => {
    await expect(confinedPath(outputDir, '/etc/passwd')).rejects.toThrow(/relative/);
  });

  it('rejects a path that leaves through a symlink', async () => {
    await expect(confinedPath(outputDir, 'escape/victim.txt')).rejects.toThrow(/outside/);
  });
});
