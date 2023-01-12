import { Arguments, Argv } from 'yargs';

import { ValidationError } from '../../errors';
import { verbose } from '../../rules/lib/util';
import { appmapDirFromConfig } from '../appmapDirFromConfig';

import validateFile from '../validateFile';
import CommandOptions from './options';
import scanArgs from '../scanArgs';
import resolveAppId from '../resolveAppId';
import singleScan from './singleScan';
import watchScan from './watchScan';
import { parseConfigFile } from '../../configuration/configurationProvider';
import { handleWorkingDirectory } from '../handleWorkingDirectory';
import { FindingState } from '../findingsState';
import { loadConfiguration as loadClientConfiguration } from '@appland/client';
import { stateFileNameArg } from '../triage/stateFileNameArg';
import assert from 'node:assert';

export default {
  command: 'scan',
  describe: 'Scan AppMaps for code behavior findings',
  builder(args: Argv): Argv {
    scanArgs(args);
    stateFileNameArg(args);

    args.option('appmap-file', {
      describe: 'single file to scan, or repeat this option to scan multiple specific files',
      alias: 'f',
    });
    args.option('ide', {
      describe: 'choose your IDE protocol to open AppMaps directly in your IDE.',
      options: ['vscode', 'x-mine', 'idea', 'pycharm'],
    });
    args.option('finding-state', {
      options: [FindingState.AsDesigned, FindingState.Deferred],
      type: 'array',
    });
    args.option('watch', {
      describe: 'scan code changes and report findings on changed files',
      default: false,
      type: 'boolean',
    });

    return args.strict();
  },
  async handler(options: Arguments): Promise<void> {
    let { appmapDir } = options as unknown as CommandOptions;
    const {
      appmapFile,
      directory,
      stateFile: stateFileName,
      config: configFile,
      verbose: isVerbose,
      watch,
      findingState: includeFindingStates,
      app: appIdArg,
      apiKey,
      ide,
      reportFile,
    } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    if (apiKey) {
      process.env.APPLAND_API_KEY = apiKey;
    }
    loadClientConfiguration();

    handleWorkingDirectory(directory);

    if (appmapFile && watch) {
      throw new ValidationError('Use --appmap-file or --watch, but not both');
    }

    if (appmapDir) await validateFile('directory', appmapDir);
    if (!appmapFile && !appmapDir) {
      appmapDir = (await appmapDirFromConfig()) || '.';
    }

    let appId = appIdArg;
    if (!watch) appId = await resolveAppId(appIdArg, appmapDir);

    if (watch) {
      assert(appmapDir);
      return watchScan({
        appId,
        stateFileName,
        appmapDir,
        configFile,
        includeFindingStates,
      });
    } else {
      const configuration = await parseConfigFile(configFile);
      return singleScan({
        appmapFile,
        appmapDir,
        stateFileName,
        configuration,
        includeFindingStates,
        appId,
        ide,
        reportFile,
      });
    }
  },
};
