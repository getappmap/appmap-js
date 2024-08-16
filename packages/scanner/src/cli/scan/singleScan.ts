import { writeFile } from 'fs/promises';
import { default as buildScanner } from './scanner';

import { ValidationError } from '../../errors';
import Configuration from '../../configuration/types/configuration';
import findingsReport from '../../report/findingsReport';
import summaryReport from '../../report/summaryReport';
import { formatReport } from './formatReport';
import { collectAppMapFiles } from '../../rules/lib/util';
import validateFile from '../validateFile';

type SingleScanOptions = {
  appmapFile?: string | string[];
  appmapDir?: string;
  configuration: Configuration;
  reportFile: string;
  ide?: string;
};

export default async function singleScan(options: SingleScanOptions): Promise<void> {
  const { appmapFile, appmapDir, configuration, ide, reportFile } = options;

  const skipErrors = appmapDir !== undefined;

  const files = await collectAppMapFiles(appmapFile, appmapDir);
  await Promise.all(files.map(async (file) => validateFile('file', file)));

  const scanner = await buildScanner(configuration, files).catch((error: Error) => {
    throw new ValidationError(error.message + '\nUse --all to perform an offline scan.');
  });

  const startTime = Date.now();

  const scanResults = await scanner.scan(skipErrors);
  await writeFile(reportFile, formatReport(scanResults));

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
}
