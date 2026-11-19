import { SourceDiffQueue } from '../../../src/diffArchive/SourceDiff';

describe('SourceDiffQueue.gitDiffArgs', () => {
  it('passes revisions and roots as separate literal arguments', () => {
    expect(SourceDiffQueue.gitDiffArgs('a$(touch x)', 'b;rm -rf /', ['app', 'my dir'])).toEqual([
      'diff',
      'a$(touch x)..b;rm -rf /',
      '--',
      'app',
      'my dir',
    ]);
  });

  it('refuses a revision that git would read as an option', () => {
    expect(() => SourceDiffQueue.gitDiffArgs('--output=/tmp/x', 'head', ['app'])).toThrow(
      /Invalid revision/
    );
    expect(() => SourceDiffQueue.gitDiffArgs('base', '-p', ['app'])).toThrow(/Invalid revision/);
  });
});
