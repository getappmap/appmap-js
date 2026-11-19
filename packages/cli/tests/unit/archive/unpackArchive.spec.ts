import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

import { confinedPath } from '../../../src/cmds/archive/unpackArchive';

describe('unpackArchive.confinedPath', () => {
  const outputDir = join('some', 'output');

  it('accepts a path inside the output directory', () => {
    expect(confinedPath(outputDir, 'sub/a.appmap.json')).toEqual(
      resolve(outputDir, 'sub/a.appmap.json')
    );
  });

  it('keeps the revision manifest name unchanged', () => {
    expect(confinedPath(outputDir, 'appmap_archive.v1.2-rc.json')).toEqual(
      resolve(outputDir, 'appmap_archive.v1.2-rc.json')
    );
  });

  it('rejects a path that climbs out with ..', () => {
    expect(() => confinedPath(outputDir, '../victim.txt')).toThrow(/outside/);
    expect(() => confinedPath(outputDir, 'sub/../../victim.txt')).toThrow(/outside/);
  });

  it('rejects an absolute path', () => {
    expect(() => confinedPath(outputDir, '/etc/passwd')).toThrow(/relative/);
  });

  describe('with symlinks restored from the archive', () => {
    let tmp: string;
    let restore: string;

    beforeEach(() => {
      tmp = mkdtempSync(join(tmpdir(), 'confined-path-'));
      restore = join(tmp, 'restore');
      mkdirSync(restore);
      mkdirSync(join(tmp, 'outside'));
      writeFileSync(join(tmp, 'outside', 'victim.appmap.json'), '{}');
    });

    afterEach(() => rmSync(tmp, { recursive: true, force: true }));

    it('rejects a path through a symlinked directory that points outside', () => {
      symlinkSync('../outside', join(restore, 'evil'));
      expect(() => confinedPath(restore, 'evil/victim.appmap.json')).toThrow(/outside/);
      // Also when the file itself does not exist yet.
      expect(() => confinedPath(restore, 'evil/new/a.appmap.json')).toThrow(/outside/);
    });

    it('rejects a file that is a symlink to a file outside', () => {
      symlinkSync('../outside/victim.appmap.json', join(restore, 'appmap_archive.v1.json'));
      expect(() => confinedPath(restore, 'appmap_archive.v1.json')).toThrow(/outside/);
    });

    it('accepts a path through a symlink that stays inside', () => {
      mkdirSync(join(restore, 'real'));
      symlinkSync('real', join(restore, 'alias'));
      expect(confinedPath(restore, 'alias/a.appmap.json')).toEqual(
        resolve(restore, 'alias/a.appmap.json')
      );
    });
  });
});
