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
});
