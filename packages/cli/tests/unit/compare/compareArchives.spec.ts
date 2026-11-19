import { archiveOutputPath } from '../../../src/cmds/archive/archiveHandler';

describe('archiveOutputPath', () => {
  const wd = '/work';

  it('puts a file name in the output directory', () => {
    expect(archiveOutputPath(wd, '.appmap/archive/full', 'x.tar')).toEqual(
      '/work/.appmap/archive/full/x.tar'
    );
  });

  it('puts a relative path with a directory under the output directory, as before', () => {
    expect(archiveOutputPath(wd, 'out', 'a/b.tar')).toEqual('/work/out/a/b.tar');
  });

  it('uses an absolute path as given', () => {
    expect(archiveOutputPath(wd, '.appmap/archive/full', '/tmp/out.tar')).toEqual('/tmp/out.tar');
  });

  it('accepts an absolute output directory', () => {
    expect(archiveOutputPath(wd, '/archives', 'r1.tar')).toEqual('/archives/r1.tar');
  });
});
