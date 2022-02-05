import { verbose } from '../../rules/lib/util';
import { Arguments, Argv } from 'yargs';
import CommandOptions from './options';
import { ScanResults } from '../../integration/appland/scanResults';
import resolveAppId from '../resolveAppId';

export default {
  command: 'merge <merge-key>',
  describe: 'Merge scan results from parallel scans',
  builder(args: Argv): Argv {
    args.option('api-key', {
      describe:
        'AppMap server API key. Use of this option is discouraged; set APPLAND_API_KEY instead',
    });
    args.option('app', {
      describe:
        'name of the app to publish the findings for. By default, this is determined by looking in appmap.yml',
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

    args.positional('merge-key', {
      describe: 'build job identifier. This is used to merge findings from parallelized scans',
      type: 'string',
    });

    return args.strict();
  },
  async handler(options: Arguments): Promise<void> {
    const {
      verbose: isVerbose,
      app: appIdArg,
      /*
      fail,
      updateCommitStatus,
      */
      mergeKey,
    } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    const appId = await resolveAppId(appIdArg, '.');

    const mergeResults = await ScanResults.merge(appId, mergeKey);
    console.warn(mergeResults);

    // It also has to collect the final findings, and fail the build if so instructed.
  },
};
