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

export default {
  command: 'scan',
  describe: 'Scan AppMaps for code behavior findings',
  builder(args: Argv): Argv {
    scanArgs(args);

    args.option('appmap-file', {
      describe: 'single file to scan, or repeat this option to scan multiple specific files',
      alias: 'f',
    });
    args.option('ide', {
      describe: 'choose your IDE protocol to open AppMaps directly in your IDE.',
      options: ['vscode', 'x-mine', 'idea', 'pycharm'],
    });
    args.option('all', {
      describe: 'report all findings, including duplicates of known findings',
      default: false,
      type: 'boolean',
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
      config,
      directory,
      verbose: isVerbose,
      all: reportAllFindings,
      watch,
      app: appIdArg,
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
    if (reportAllFindings && watch) {
      throw new ValidationError(
        `Don't use --all with --watch, because in watch mode all findings are reported`
      );
    }
    if (appIdArg && watch) {
      throw new ValidationError(
        `Don't use --app with --watch, because in watch mode all findings are reported`
      );
    }
    if (!appmapFile && !appmapDir) {
      appmapDir = (await appmapDirFromConfig()) || '.';
    }
    if (appmapDir) await validateFile('directory', appmapDir);

    if (watch) {
      const watchAppMapDir = appmapDir!;
      return watchScan({ appmapDir: watchAppMapDir, configFile: config });
    } else {
      let appId = appIdArg;
      if (!reportAllFindings) {
        appId = await resolveAppId(appIdArg, appmapDir);
      }
      const configData = await parseConfigFile(config);

      return singleScan({
        appmapFile,
        appmapDir,
        configData,
        reportAllFindings,
        appId,
        ide,
        reportFile,
      });
    }
  },
};
