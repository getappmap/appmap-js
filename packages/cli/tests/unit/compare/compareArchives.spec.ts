import { resolveOutputPath } from '../../../src/cmds/archive/archiveHandler';

describe('resolveOutputPath', () => {
  const wd = '/work';

  it('puts a bare file name in the default output directory', () => {
    expect(resolveOutputPath(wd, 'full', 'r1', 'x.tar', undefined)).toEqual(
      '/work/.appmap/archive/full/x.tar'
    );
  });

  it('puts a bare file name in --output-dir', () => {
    expect(resolveOutputPath(wd, 'full', 'r1', 'x.tar', 'out')).toEqual('/work/out/x.tar');
  });

  it('uses an absolute path as given', () => {
    expect(resolveOutputPath(wd, 'full', 'r1', '/tmp/out.tar', undefined)).toEqual('/tmp/out.tar');
  });

  it('resolves a path with a directory against the working directory', () => {
    expect(resolveOutputPath(wd, 'full', 'r1', 'a/b.tar', undefined)).toEqual('/work/a/b.tar');
  });

  it('rejects a path with a directory together with --output-dir', () => {
    expect(() => resolveOutputPath(wd, 'full', 'r1', 'a/b.tar', 'out')).toThrow(/--output-dir/);
  });

  it('defaults to <revision>.tar', () => {
    expect(resolveOutputPath(wd, 'incremental', 'r1', undefined, undefined)).toEqual(
      '/work/.appmap/archive/incremental/r1.tar'
    );
  });
});
