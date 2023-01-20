import { glob as globCallback } from 'glob';
import { writeFile } from 'fs/promises';
import { promisify } from 'util';
import { Arguments, Argv } from 'yargs';

import {
  FindingStatusListItem,
  loadConfiguration as loadClientConfiguration,
} from '@appland/client/dist/src';

import { parseConfigFile } from '../../configuration/configurationProvider';
import { ValidationError } from '../../errors';
import { ScanResults } from '../../report/scanResults';
import { verbose } from '../../rules/lib/util';
import { appmapDirFromConfig } from '../appmapDirFromConfig';
import selectFindings from '../../selectFindings';
import findingsReport from '../../report/findingsReport';
import summaryReport from '../../report/summaryReport';

import resolveAppId from '../resolveAppId';
import validateFile from '../validateFile';
import upload from '../upload';
import Scanner, { default as buildScanner } from '../scan/scanner';

import CommandOptions from './options';
import scanArgs from '../scanArgs';
import updateCommitStatus from '../updateCommitStatus';
import reportUploadURL from '../reportUploadURL';
import fail from '../fail';
import codeVersionArgs from '../codeVersionArgs';
import { handleWorkingDirectory } from '../handleWorkingDirectory';
import { stateFileNameArg } from '../triage/stateFileNameArg';
import assert from 'assert';

export default {
  command: 'ci',
  describe: 'Scan AppMaps, report findings to AppMap Server, and update SCM status',
  builder(args: Argv): Argv {
    scanArgs(args);
    codeVersionArgs(args);
    stateFileNameArg(args);

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
    let { appmapDir } = options as unknown as CommandOptions;
    const {
      config,
      stateFile: stateFileName,
      verbose: isVerbose,
      fail: failOption,
      app: appIdArg,
      directory,
      reportFile,
      upload: doUpload,
      updateCommitStatus: updateCommitStatusOption,
      mergeKey,
      commit,
      branch,
      environment,
    } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    loadClientConfiguration();

    handleWorkingDirectory(directory);

    if (!appmapDir) {
      appmapDir = await appmapDirFromConfig();
    }
    if (!appmapDir)
      throw new ValidationError(
        'appmapDir must be provided as a command option, or available in appmap.yml'
      );

    await validateFile('directory', appmapDir!);
    const appId = await resolveAppId(appIdArg, appmapDir, true);
    assert(appId);

    const glob = promisify(globCallback);
    const files = await glob(`${appmapDir}/**/*.appmap.json`);

    const configData = await parseConfigFile(config);

    const scanner = new Scanner(configData, files);

    const [rawScanResults, findingStatuses]: [ScanResults, FindingStatusListItem[]] =
      await Promise.all([
        scanner.scan(),
        scanner.fetchFindingStatus(stateFileName, appIdArg, appmapDir),
      ]);

    // Always report the raw data
    await writeFile(reportFile, JSON.stringify(rawScanResults, null, 2));

    const scanResults = rawScanResults.withFindings(
      selectFindings(rawScanResults.findings, findingStatuses, [])
    );

    findingsReport(scanResults.findings, scanResults.appMapMetadata);
    summaryReport(scanResults, true);

    if (doUpload) {
      const uploadResponse = await upload(
        rawScanResults,
        appId,
        appmapDir,
        mergeKey,
        {
          branch,
          commit,
          environment,
        },
        {
          maxRetries: 3,
        }
      );
      reportUploadURL(uploadResponse.summary.numFindings, uploadResponse.url);
    }

    if (updateCommitStatusOption) {
      await updateCommitStatus(scanResults.findings.length, scanResults.summary.numChecks);
    }

    if (failOption) {
      fail(scanResults.findings.length);
    }
  },
};
