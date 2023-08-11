import { basename, dirname, join, sep } from 'path';
import { Finding } from '@appland/scanner';

import { executeCommand } from '../../lib/executeCommand';
import { readFile, rm, writeFile } from 'fs/promises';
import { processNamedFiles } from '../../utils';

export async function scan(appMapDir: string): Promise<number> {
  await executeCommand(`npx @appland/scanner@latest scan --appmap-dir ${appMapDir} --all`);

  const scanResultsData = await readFile('appmap-findings.json', 'utf8');
  await rm('appmap-findings.json');
  const scanResults = JSON.parse(scanResultsData);
  const scanResultsTemplateJSON = JSON.parse(scanResultsData);
  delete scanResultsTemplateJSON['findings'];
  const appMapMetadata: Record<string, any> = scanResultsTemplateJSON['appMapMetadata'];
  const scanResultsTemplate = JSON.stringify(scanResultsTemplateJSON);

  const findings: Finding[] = scanResults['findings'];
  const findingsByAppMap = findings.reduce<Map<string, Finding[]>>((memo, finding) => {
    if (!memo.has(finding.appMapFile)) memo.set(finding.appMapFile, [finding]);
    else memo.get(finding.appMapFile)!.push(finding);
    return memo;
  }, new Map<string, Finding[]>());

  return await processNamedFiles(appMapDir, 'metadata.json', async (metadataFile) => {
    // TODO: This is hacky, but scanning everything at once is an efficient way to get it done,
    // and the scanner code is not accessible from the CLI project.

    const indexDir = dirname(metadataFile);
    const appmapFileName = join(
      ...indexDir.split(sep).reverse().slice(1).reverse(),
      basename(indexDir) + '.appmap.json'
    );

    const scanResults = JSON.parse(scanResultsTemplate);
    const findings: Finding[] = findingsByAppMap.get(appmapFileName) || [];

    const scanSummary: { numAppMaps: number; numChecks: number; numFindings: number } =
      scanResults['summary'];
    scanSummary.numChecks = scanSummary.numChecks / scanSummary.numAppMaps;
    scanSummary.numAppMaps = 1;
    scanSummary.numFindings = findings.length;

    scanResults['findings'] = findings;

    const metadataEntry = appMapMetadata[appmapFileName];
    if (metadataEntry) scanResults['appMapMetadata'] = { [appmapFileName]: metadataEntry };
    else console.warn(`No appMapMetadata found for '${appmapFileName}' in scan results.`);

    await writeFile(join(indexDir, 'appmap-findings.json'), JSON.stringify(scanResults, null, 2));
  });
}
