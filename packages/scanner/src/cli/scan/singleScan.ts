import { writeFile } from 'fs/promises';
import Scanner, { default as buildScanner } from './scanner';

import Configuration from '../../configuration/types/configuration';
import selectFindings from '../../selectFindings';
import findingsReport from '../../report/findingsReport';
import summaryReport from '../../report/summaryReport';
import { formatReport } from './formatReport';
import Telemetry from '../../telemetry';
import { sendScanResultsTelemetry } from '../../report/scanResults';
import { collectAppMapFiles } from '../../rules/lib/util';
import validateFile from '../validateFile';
import { FindingState } from '../findingsState';

type SingleScanOptions = {
  appmapFile?: string | string[];
  appmapDir?: string;
  stateFileName: string;
  configuration: Configuration;
  includeFindingStates?: [FindingState.AsDesigned | FindingState.Deferred][];
  reportFile: string;
  appId?: string;
  ide?: string;
};

export default async function singleScan(options: SingleScanOptions): Promise<void> {
  let { includeFindingStates } = options;
  const { appmapFile, appmapDir, configuration, appId, ide, reportFile } = options;
  if (!includeFindingStates) includeFindingStates = [];
  Telemetry.sendEvent({
    name: 'scan:started',
    properties: {
      ide,
    },
  });

  const skipErrors = appmapDir !== undefined;

  const files = await collectAppMapFiles(appmapFile, appmapDir);
  await Promise.all(files.map(async (file) => validateFile('file', file)));

  const scanner = new Scanner(configuration, files);

  const startTime = Date.now();

  const [rawScanResults, findingStatuses] = await Promise.all([
    scanner.scan(skipErrors),
    scanner.fetchFindingStatus(options.stateFileName, appId, appmapDir),
  ]);

  // Always report the raw data
  await writeFile(reportFile, formatReport(rawScanResults));

  const scanResults = rawScanResults.withFindings(
    selectFindings(rawScanResults.findings, findingStatuses, includeFindingStates)
  );

  findingsReport(scanResults.findings, scanResults.appMapMetadata, ide);
  console.log();
  summaryReport(scanResults, true);
  console.log('\n');
  const elapsed = Date.now() - startTime;

  const numChecks = scanResults.checks.length * scanResults.summary.numAppMaps;
  console.log(
    `Performed ${numChecks} checks in ${elapsed}ms (${Math.floor(
      numChecks / (elapsed / 1000.0)
    )} checks/sec)`
  );

  sendScanResultsTelemetry({
    ruleIds: scanResults.summary.rules,
    numAppMaps: scanResults.summary.numAppMaps,
    numFindings: scanResults.summary.numFindings,
    elapsedMs: elapsed,
  });
}
