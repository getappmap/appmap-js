import { Metadata } from '@appland/models';
import { AppMapMetadata, isTest } from '../../../src/diffArchive/ChangeAnalysis';
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
