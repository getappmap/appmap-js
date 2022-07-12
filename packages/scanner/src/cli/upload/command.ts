import { Arguments, Argv } from 'yargs';
import { readFile } from 'fs/promises';

import { ScanResults } from '../../report/scanResults';
import { verbose } from '../../rules/lib/util';
import { appmapDirFromConfig } from '../appmapDirFromConfig';

import validateFile from '../validateFile';
import resolveAppId from '../resolveAppId';
import reportUploadURL from '../reportUploadURL';

import CommandOptions from './options';
import upload from '../upload';
import codeVersionArgs from '../codeVersionArgs';
import { ValidationError } from '../../errors';
import { handleWorkingDirectory } from '../handleWorkingDirectory';

export default {
  command: 'upload',
  describe: 'Upload Findings to the AppMap Server',
  builder(args: Argv): Argv {
    codeVersionArgs(args);

    args.option('directory', {
      describe: 'program working directory',
      type: 'string',
      alias: 'd',
    });
    args.option('appmap-dir', {
      describe: 'base directory of AppMaps',
    });
    args.option('report-file', {
      describe: 'file containing the findings report',
      default: 'appmap-findings.json',
    });
    args.option('app', {
      describe:
        'name of the app to publish the findings for. By default, this is determined by looking in appmap.yml',
    });
    args.option('merge-key', {
      describe: 'build job identifier. This is used to merge findings from parallelized scans',
    });
    return args.strict();
  },
  async handler(options: Arguments): Promise<void> {
    let { appmapDir } = options as unknown as CommandOptions;
    const {
      verbose: isVerbose,
      directory,
      reportFile,
      app: appIdArg,
      mergeKey,
      branch,
      commit,
      environment,
    } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    handleWorkingDirectory(directory);

    if (!appmapDir) {
      appmapDir = await appmapDirFromConfig();
    }
    if (!appmapDir)
      throw new ValidationError(
        'appmapDir must be provided as a command option, or available in appmap.yml'
      );

    await validateFile('directory', appmapDir!);
    const appId = await resolveAppId(appIdArg, appmapDir);

    const scanResults = JSON.parse((await readFile(reportFile)).toString()) as ScanResults;
    const uploadResponse = await upload(
      scanResults,
      appId,
      appmapDir,
      mergeKey,
      { branch, commit, environment },
      {
        maxRetries: 3,
      }
    );

    reportUploadURL(uploadResponse.summary.numFindings, uploadResponse.url);
  },
};
