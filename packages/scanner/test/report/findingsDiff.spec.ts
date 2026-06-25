import { Finding } from '../../src';
import { diffFindings } from '../../src/report/findingsDiff';

const finding = (hashV2: string, ruleId = 'rule-a', impactDomain = 'Security'): Finding =>
  ({ hash_v2: hashV2, ruleId, impactDomain } as Finding);

describe('diffFindings', () => {
  it('classifies findings as new or resolved by hash_v2', () => {
    const { newFindings, resolvedFindings } = diffFindings(
      [finding('h1'), finding('h2')],
      [finding('h2'), finding('h3')]
    );

    expect(newFindings.map((f) => f.hash_v2)).toEqual(['h3']);
    expect(resolvedFindings.map((f) => f.hash_v2)).toEqual(['h1']);
  });

  it('dedupes by hash_v2 on both sides', () => {
    const { newFindings, resolvedFindings } = diffFindings(
      [finding('h1'), finding('h1')],
      [finding('h1'), finding('h2'), finding('h2')]
    );

    expect(newFindings.map((f) => f.hash_v2)).toEqual(['h2']);
    expect(resolvedFindings).toEqual([]);
  });

  it('treats every finding as new when there is no prior report', () => {
    const { newFindings, resolvedFindings } = diffFindings([], [finding('h1'), finding('h2')]);

    expect(newFindings.map((f) => f.hash_v2)).toEqual(['h1', 'h2']);
    expect(resolvedFindings).toEqual([]);
  });
});
