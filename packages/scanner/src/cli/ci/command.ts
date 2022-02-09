import { glob as globCallback } from 'glob';
import { writeFile } from 'fs/promises';
import { promisify } from 'util';
import { Arguments, Argv } from 'yargs';

import { FindingStatusListItem } from '@appland/client/dist/src';

import { parseConfigFile } from '../../configuration/configurationProvider';
import { AbortError, ValidationError } from '../../errors';
import { ScanResults } from '../../report/scanResults';
import { verbose } from '../../rules/lib/util';
import { create as uploadScannerJob } from '../../integration/appland/scannerJob/create';
import { newFindings } from '../../findings';
import findingsReport from '../../report/findingsReport';
import summaryReport from '../../report/summaryReport';

import { ExitCode } from '../exitCode';
import resolveAppId from '../resolveAppId';
import validateFile from '../validateFile';
import { default as buildScanner } from '../scan/scanner';

import CommandOptions from './options';
import scanArgs from '../scanArgs';
import updateCommitStatus from '../updateCommitStatus';
import reportUploadURL from '../reportUploadURL';
import fail from '../fail';

export default {
  command: 'ci',
  describe: 'Scan AppMaps, report findings to AppMap Server, and update SCM status',
  builder(args: Argv): Argv {
    scanArgs(args);

    args.option('fail', {
      describe: 'exit with non-zero status if there are any new findings',
      default: false,
      type: 'boolean',
    });
    args.option('update-commit-status', {
      describe: 'update commit status in SCM system',
      default: false,
      type: 'boolean',
    });
    args.option('upload', {
      describe: 'upload findings to AppMap server',
      default: true,
      type: 'boolean',
    });
    args.option('merge-key', {
      describe: 'build job identifier. This is used to merge findings from parallelized scans',
    });

    return args.strict();
  },
  async handler(options: Arguments): Promise<void> {
    const {
      appmapDir,
      config,
      verbose: isVerbose,
      fail: failOption,
      app: appIdArg,
      reportFile,
      upload: doUpload,
      updateCommitStatus: updateCommitStatusOption,
      mergeKey,
    } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    try {
      if (!appmapDir) {
        throw new ValidationError('--appmap-dir is required');
      }

      await validateFile('directory', appmapDir!);
      const glob = promisify(globCallback);
      const files = await glob(`${appmapDir}/**/*.appmap.json`);

      const appId = await resolveAppId(appIdArg, appmapDir);

      const configData = await parseConfigFile(config);

      const scanner = buildScanner(false, configData, files);

      const [rawScanResults, findingStatuses]: [ScanResults, FindingStatusListItem[]] =
        await Promise.all([scanner.scan(), scanner.fetchFindingStatus(appIdArg, appmapDir)]);

      // Always report the raw data
      await writeFile(reportFile, JSON.stringify(rawScanResults, null, 2));

      const scanResults = rawScanResults.withFindings(
        newFindings(rawScanResults.findings, findingStatuses)
      );

      findingsReport(scanResults.findings, scanResults.appMapMetadata);
      summaryReport(scanResults, true);

      if (doUpload) {
        const uploadResponse = await uploadScannerJob(rawScanResults, appId, mergeKey);
        reportUploadURL(uploadResponse.summary.numFindings, uploadResponse.url);
      }

      if (updateCommitStatusOption) {
        await updateCommitStatus(scanResults.findings.length, scanResults.summary.numChecks);
      }

      if (failOption) {
        fail(scanResults.findings.length);
      }
    } catch (err) {
      if (err instanceof ValidationError) {
        console.warn(err.message);
        return process.exit(ExitCode.ValidationError);
      }
      if (err instanceof AbortError) {
        return process.exit(ExitCode.AbortError);
      }
      if (!verbose && err instanceof Error) {
        console.error(err.message);
        return process.exit(ExitCode.RuntimeError);
      }

      throw err;
    }
  },
};
