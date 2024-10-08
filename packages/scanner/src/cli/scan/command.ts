import { Arguments, Argv } from 'yargs';

import { ValidationError } from '../../errors';
import { verbose } from '../../rules/lib/util';
import { appmapDirFromConfig } from '../appmapDirFromConfig';

import validateFile from '../validateFile';
import CommandOptions from './options';
import scanArgs from '../scanArgs';
import singleScan from './singleScan';
import watchScan from './watchScan';
import { parseConfigFile } from '../../configuration/configurationProvider';
import { handleWorkingDirectory } from '../handleWorkingDirectory';
import interactiveScan from './interactiveScan';

export default {
  command: 'scan',
  describe: 'Scan AppMaps for code behavior findings',
  builder(args: Argv): Argv {
    scanArgs(args);

    args.option('interactive', {
      describe: 'scan in interactive mode',
      alias: 'i',
    });
    args.option('appmap-file', {
      describe: 'single file to scan, or repeat this option to scan multiple specific files',
      alias: 'f',
    });
    args.option('ide', {
      describe: 'choose your IDE protocol to open AppMaps directly in your IDE.',
      options: ['vscode', 'x-mine', 'idea', 'pycharm'],
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
      interactive,
      config: configFile,
      verbose: isVerbose,
      watch,
      apiKey,
      ide,
      reportFile,
    } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    handleWorkingDirectory(directory);

    if (apiKey) {
      process.env.APPLAND_API_KEY = apiKey;
    }

    if (appmapFile && watch) {
      throw new ValidationError('Use --appmap-file or --watch, but not both');
    }

    if (appmapDir) await validateFile('directory', appmapDir);
    if (!appmapFile && !appmapDir) {
      appmapDir = (await appmapDirFromConfig()) || '.';
    }

    if (watch) {
      const watchAppMapDir = appmapDir!;
      return watchScan({ appmapDir: watchAppMapDir, configFile });
    } else {
      const configuration = await parseConfigFile(configFile);
      if (interactive) {
        return interactiveScan({
          appmapFile,
          appmapDir,
          configuration,
        });
      } else {
        return singleScan({
          appmapFile,
          appmapDir,
          configuration,
          ide,
          reportFile,
        });
      }
    }
  },
};
