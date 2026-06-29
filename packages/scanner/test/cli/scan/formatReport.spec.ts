import { Finding } from '../../../src';
import { ScanResults } from '../../../src/report/scanResults';
import { formatReport } from '../../../src/cli/scan/formatReport';

const finding = (hash: string, hashV2: string): Finding =>
  ({ hash, hash_v2: hashV2, ruleId: 'rule-a' } as Finding);

const reportFindings = (findings: Finding[]) =>
  JSON.parse(formatReport(new ScanResults({ checks: [] }, {}, findings, []))) as {
    findings: Finding[];
    summary: { numFindings: number };
  };

describe('formatReport finding dedup', () => {
  // Two distinct findings (different hash_v2) that happen to share a legacy v1 hash must
  // both be kept; otherwise the persisted report loses one and the findings diff would
  // re-report it as "new" on every rescan.
  it('keeps v2-distinct findings that share a v1 hash', () => {
    const report = reportFindings([finding('h1', 'v1'), finding('h1', 'v2')]);

    expect(report.findings.map((f) => f.hash_v2).sort()).toEqual(['v1', 'v2']);
    expect(report.summary.numFindings).toEqual(2);
  });

  it('collapses findings that share a hash_v2', () => {
    const report = reportFindings([finding('h1', 'v1'), finding('h2', 'v1')]);

    expect(report.findings.map((f) => f.hash_v2)).toEqual(['v1']);
    expect(report.summary.numFindings).toEqual(1);
  });
});
