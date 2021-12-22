import { glob as globCallback } from 'glob';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';
import yargs, { Arguments, Argv } from 'yargs';

import { FindingStatusListItem } from '@appland/client';

import { loadConfig, parseConfigFile } from '../../configuration/configurationProvider';
import { AbortError, ValidationError } from '../../errors';
import { ScanResults } from '../../report/scanResults';
import { verbose } from '../../rules/util';
import fetchStatus from '../../integration/appland/fetchStatus';
import upload from '../../integration/appland/upload';
import postCommitStatus from '../../integration/github/commitStatus';
import { newFindings } from '../../findings';
import summaryReport from '../../report/summaryReport';

import { ExitCode } from '../exitCode';
import resolveAppId from '../resolveAppId';
import validateFile from '../validateFile';

import CommandOptions from './options';
import scan from '../scan';

export default {
  command: 'ci',
  describe: 'Scan AppMaps, report findings to AppMap Server, and update SCM status',
  builder(args: Argv): Argv {
    args.option('appmap-dir', {
      describe: 'directory to recursively inspect for AppMaps',
      alias: 'd',
    });
    args.option('config', {
      describe:
        'path to assertions config file (TypeScript or YAML, check docs for configuration format)',
      default: join(__dirname, './sampleConfig/default.yml'),
      alias: 'c',
    });
    args.option('fail', {
      describe: 'exit with non-zero status if there are any new findings',
      default: false,
      type: 'boolean',
    });
    args.option('update-commit-status', {
      describe: 'update commit status in SCM system',
      default: true,
      type: 'boolean',
    });
    args.option('upload', {
      describe: 'upload findings to AppMap server',
      default: true,
      type: 'boolean',
    });
    args.option('report-file', {
      describe: 'file name for findings report',
      default: 'appland-findings.json',
    });
    args.option('app', {
      describe:
        'name of the app to publish the findings for. By default, this is determined by looking in appmap.yml',
    });

    return args.strict();
  },
  async handler(options: Arguments): Promise<void> {
    const {
      appmapDir,
      config,
      verbose: isVerbose,
      fail,
      app: appIdArg,
      reportFile,
      upload: doUpload,
      updateCommitStatus,
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

      const appId = (await resolveAppId(appIdArg, appmapDir, true))!;

      const configData = await parseConfigFile(config);
      const checks = await loadConfig(configData);

      const [rawScanResults, findingStatuses] = await Promise.all<
        ScanResults,
        FindingStatusListItem[]
      >([
        (async (): Promise<ScanResults> => {
          const { appMapMetadata, findings } = await scan(files, checks);
          return new ScanResults(configData, appMapMetadata, findings, checks);
        })(),
        fetchStatus.bind(null, appId)(),
      ]);

      // Always report the raw data
      await writeFile(reportFile, JSON.stringify(rawScanResults, null, 2));

      const scanResults = rawScanResults.withFindings(
        newFindings(rawScanResults.findings, findingStatuses)
      );

      const colouredSummary = summaryReport(scanResults, true);
      process.stdout.write('\n');
      process.stdout.write(colouredSummary);
      process.stdout.write('\n');

      if (doUpload) {
        await upload(scanResults, appId);
      }

      if (updateCommitStatus) {
        if (scanResults.findings.length > 0) {
          await postCommitStatus(
            'failure',
            `${scanResults.summary.numChecks} checks, ${scanResults.findings.length} findings. See CI job log for details.`
          );
          console.log(
            `Commit status updated to: failure (${scanResults.findings.length} findings)`
          );
        } else {
          await postCommitStatus('success', `${scanResults.summary.numChecks} checks passed`);
          console.log(`Commit status updated to: success.`);
        }
      }

      if (fail) {
        if (scanResults.findings.length > 0) {
          yargs.exit(1, new Error(`${scanResults.findings.length} findings`));
        }
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
