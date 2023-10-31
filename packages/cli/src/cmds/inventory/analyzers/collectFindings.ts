import { Finding, ScanResults } from '@appland/scanner';
import readIndexFile from '../readIndexFile';
import { FindingExample } from '../Report';

export default function collectFindings(findings: FindingExample[]) {
  const modifiedDate = (finding: Finding): Date | undefined =>
    finding.eventsModifiedDate || finding.scopeModifiedDate;

  return async (appmap: string) => {
    const scanResults = (await readIndexFile(appmap, 'appmap-findings.json')) as ScanResults;
    if (!scanResults) return;

    for (const finding of scanResults.findings) {
      const mDate = modifiedDate(finding);
      if (mDate)
        findings.push({
          appmap,
          impactDomain: finding.impactDomain,
          modifiedDate: new Date(mDate),
          hash_v2: finding.hash_v2,
        });
    }
  };
}
