import { glob as globCallback } from 'glob';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';
import { Arguments, Argv } from 'yargs';

import { FindingStatusListItem } from '@appland/client';

import { loadConfig, parseConfigFile } from '../../configuration/configurationProvider';
import { AbortError, ValidationError } from '../../errors';
import { ScanResults } from '../../report/scanResults';
import { verbose } from '../../rules/util';
import fetchStatus from '../../integration/appland/fetchStatus';
import { newFindings } from '../../findings';
import findingsReport from '../../report/findingsReport';
import summaryReport from '../../report/summaryReport';

import { ExitCode } from '../exitCode';
import validateFile from '../validateFile';

import CommandOptions from './options';
import resolveAppId from '../resolveAppId';
import scan from '../scan';

export default {
  command: 'scan',
  describe: 'Scan AppMaps for code behavior findings',
  builder(args: Argv): Argv {
    args.option('appmap-dir', {
      describe: 'directory to recursively inspect for AppMaps',
      alias: 'd',
    });
    args.option('appmap-file', {
      describe: 'single file to scan',
      alias: 'f',
    });
    args.option('config', {
      describe:
        'path to assertions config file (TypeScript or YAML, check docs for configuration format)',
      default: join(__dirname, '..', '..', 'sampleConfig', 'default.yml'),
      alias: 'c',
    });
    args.option('ide', {
      describe: 'choose your IDE protocol to open AppMaps directly in your IDE.',
      options: ['vscode', 'x-mine', 'idea', 'pycharm'],
    });
    args.option('report-file', {
      describe: 'file name for findings report',
      default: 'appland-findings.json',
    });
    args.option('all', {
      describe: 'report all findings, including duplicates of known findings',
      default: false,
      type: 'boolean',
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
      appmapFile,
      config,
      verbose: isVerbose,
      all: reportAllFindings,
      app: appIdArg,
      ide,
      reportFile,
    } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    try {
      if (appmapFile && appmapDir) {
        throw new ValidationError('Use --appmap-dir or --appmap-file, but not both');
      }
      if (!appmapFile && !appmapDir) {
        throw new ValidationError('Either --appmap-dir or --appmap-file is required');
      }

      let files: string[] = [];
      if (appmapDir) {
        await validateFile('directory', appmapDir!);
        const glob = promisify(globCallback);
        files = await glob(`${appmapDir}/**/*.appmap.json`);
      }
      if (appmapFile) {
        await validateFile('file', appmapFile);
        files = [appmapFile];
      }

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
        (async (): Promise<FindingStatusListItem[]> => {
          const appId = await resolveAppId(appIdArg, appmapDir, false);
          if (!appId) {
            return [];
          }

          return await fetchStatus(appId);
        })(),
      ]);

      // Always report the raw data
      await writeFile(reportFile, JSON.stringify(rawScanResults, null, 2));

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
