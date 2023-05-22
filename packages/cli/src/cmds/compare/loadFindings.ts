import assert from 'assert';
import { Finding } from '../../lib/findings';
import { ArchiveMetadata } from '../archive/ArchiveMetadata';
import { AppMapData } from './AppMapData';
import { RevisionName } from './RevisionName';
import { SemVer } from 'semver';
import { executeCommand } from '../../lib/executeCommand';
import { readFile } from 'fs/promises';
import { processNamedFiles } from '../../utils';

export default async function loadFindings(
  appmapData: AppMapData,
  revisionName: RevisionName
): Promise<Finding[]> {
  const manifest: ArchiveMetadata = JSON.parse(
    await readFile(appmapData.manifestPath(revisionName), 'utf-8')
  );

  const findings = new Array<Finding>();

  const collectFindings = (findings: Finding[]): ((findingsFile: string) => Promise<void>) => {
    return async (findingsFile: string) => {
      const findingsData = JSON.parse(await readFile(findingsFile, 'utf-8'));
      findings.push(...(findingsData.findings as Finding[]));
    };
  };

  let archiveVersion = manifest.versions.archive;
  assert(archiveVersion);
  if (archiveVersion.split('.').length === 2) archiveVersion += '.0';
  if (new SemVer(archiveVersion).compare('1.3.0') < 0) {
    const workingDir = appmapData.revisionPath(revisionName);
    console.info(
      `Scanning ${revisionName} revision for findings (archive version: ${archiveVersion}).`
    );
    let command = `npx @appland/scanner@latest scan -d ${workingDir} --all`;
    await executeCommand(command);

    // Pre-1.3.0 archive. Scan and load findings the old way.
    const scanResults = JSON.parse(await readFile(appmapData.findingsPath(revisionName), 'utf-8'));
    findings.push(...(scanResults.findings || []));
  } else {
    await processNamedFiles(
      appmapData.revisionPath(revisionName),
      'appmap-findings.json',
      collectFindings(findings)
    );
  }

  console.info(`Found ${findings.length} findings for ${revisionName} revision`);

  return findings;
}
