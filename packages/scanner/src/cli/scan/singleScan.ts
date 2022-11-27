import { writeFile } from 'fs/promises';
import { default as buildScanner } from './scanner';

import { ValidationError } from '../../errors';
import Configuration from '../../configuration/types/configuration';
import { newFindings } from '../../findings';
import findingsReport from '../../report/findingsReport';
import summaryReport from '../../report/summaryReport';
import { formatReport } from './formatReport';
import Telemetry from '../../telemetry';
import { sendScanResultsTelemetry } from '../../report/scanResults';
import { collectAppMapFiles } from '../../rules/lib/util';
import validateFile from '../validateFile';

type SingleScanOptions = {
  appmapFile?: string | string[];
  appmapDir?: string;
  configuration: Configuration;
  reportAllFindings: boolean;
  reportFile: string;
  appId?: string;
  ide?: string;
};

export default async function singleScan(options: SingleScanOptions): Promise<void> {
  const { appmapFile, appmapDir, configuration, reportAllFindings, appId, ide, reportFile } =
    options;
  Telemetry.sendEvent({
    name: 'scan:started',
    properties: {
      ide,
    },
  });

  const skipErrors = appmapDir !== undefined;

  const files = await collectAppMapFiles(appmapFile, appmapDir);
  await Promise.all(files.map(async (file) => validateFile('file', file)));

  const scanner = await buildScanner(reportAllFindings, configuration, files).catch(
    (error: Error) => {
      throw new ValidationError(error.message + '\nUse --all to perform an offline scan.');
    }
  );

  const startTime = Date.now();

  const [rawScanResults, findingStatuses] = await Promise.all([
    scanner.scan(skipErrors),
    scanner.fetchFindingStatus(appId, appmapDir),
  ]);

  // Always report the raw data
  await writeFile(reportFile, formatReport(rawScanResults));

  let scanResults;
  if (reportAllFindings) {
    scanResults = rawScanResults;
  } else {
    scanResults = rawScanResults.withFindings(
      newFindings(rawScanResults.findings, findingStatuses)
    );
  }

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
