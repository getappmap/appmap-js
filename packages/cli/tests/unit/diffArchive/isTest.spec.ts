import { Metadata } from '@appland/models';
import { AppMapMetadata, isTest, nameList } from '../../../src/diffArchive/ChangeAnalysis';
import { RevisionName } from '../../../src/diffArchive/RevisionName';

describe('ChangeAnalysis.isTest', () => {
  const metadata = (recorder?: Record<string, string>): AppMapMetadata => ({
    base: new Map(),
    head: new Map([['theappmap', { recorder } as unknown as Metadata]]),
  });

  it('accepts a recording made by a test recorder', () => {
    expect(isTest(RevisionName.Head, metadata({ name: 'rspec', type: 'tests' }))('theappmap')).toBe(
      true
    );
  });

  it('treats a recording with no metadata.recorder as not a test', () => {
    expect(isTest(RevisionName.Head, metadata(undefined))('theappmap')).toBe(false);
  });

  it('treats a recorder with no type as not a test', () => {
    expect(isTest(RevisionName.Head, metadata({ name: 'rspec' }))('theappmap')).toBe(false);
  });

  it('treats an unknown recording as not a test', () => {
    expect(isTest(RevisionName.Base, metadata(undefined))('theappmap')).toBe(false);
  });
});

describe('ChangeAnalysis.nameList', () => {
  it('lists every name when there are ten or fewer', () => {
    expect(nameList(['a', 'b'])).toEqual('a, b');
  });

  it('lists the first ten names, then says how many more there are', () => {
    const names = Array.from({ length: 13 }, (_, i) => `r${i}`);
    expect(nameList(names)).toEqual('r0, r1, r2, r3, r4, r5, r6, r7, r8, r9, and 3 more');
  });
});
