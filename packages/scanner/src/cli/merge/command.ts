import { verbose } from '../../rules/lib/util';
import { Arguments, Argv } from 'yargs';
import CommandOptions from './options';
import { merge as mergeScannerJob } from '../../integration/appland/scannerJob/merge';
import resolveAppId from '../resolveAppId';
import updateCommitStatus from '../updateCommitStatus';
import fail from '../fail';

export default {
  command: 'merge <merge-key>',
  describe: 'Merge scan results from parallel scans',
  builder(args: Argv): Argv {
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
      default: false,
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
      fail: failOption,
      updateCommitStatus: updateCommitStatusOption,
      mergeKey,
    } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    const appId = await resolveAppId(appIdArg, '.');

    const mergeResults = await mergeScannerJob(appId, mergeKey);
    console.warn(`Merged results to ${mergeResults.url}`);

    if (updateCommitStatusOption) {
      await updateCommitStatus(mergeResults.summary.numFindings, mergeResults.summary.numChecks);
    }

    if (failOption) {
      fail(mergeResults.summary.numFindings);
    }
  },
};
