import { readFile } from 'fs/promises';
import { Finding } from '@appland/scanner';

import { Paths } from './Paths';
import { RevisionName } from './RevisionName';
import { processNamedFiles } from '../../utils';

export default async function loadFindings(
  paths: Paths,
  revisionName: RevisionName,
  appMapDir: string
): Promise<Finding[]> {
  const findings = new Array<Finding>();

  const collectFindings = (findings: Finding[]): ((findingsFile: string) => Promise<void>) => {
    return async (findingsFile: string) => {
      const findingsData = JSON.parse(await readFile(findingsFile, 'utf-8'));
      findings.push(...(findingsData.findings as Finding[]));
    };
  };

  await processNamedFiles(
    paths.revisionPath(revisionName),
    'appmap-findings.json',
    collectFindings(findings)
  );

  console.info(`Found ${findings.length} findings for ${revisionName} revision`);

  for (const finding of findings) {
    if (finding.appMapFile.startsWith(appMapDir)) {
      finding.appMapFile = finding.appMapFile.slice(appMapDir.length + 1);
    }
  }
  return findings;
}
