import yargs from 'yargs';
import lazyHandler from '../../lib/lazyHandler';

export const command = 'restore';
export const describe = 'Restore the most current available AppMap data from available archives';

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });

  args.option('revision', {
    describe: `revision to restore`,
    type: 'string',
    alias: 'r',
  });

  args.option('output-dir', {
    describe: 'directory in which to restore the data. Default: .appmap/work/<revision>',
    type: 'string',
  });

  args.option('archive-dir', {
    describe: 'directory in which the archives are stored',
    type: 'string',
    default: '.appmap/archive',
  });

  args.option('github-repo', {
    describe:
      'Fetch AppMap archives from artifacts on a GitHub repository. GITHUB_TOKEN must be set for this option to work.',
    type: 'string',
  });

  args.option('exact', {
    describe: 'fail unless the specific revision requested is available to be restored',
    type: 'boolean',
    default: false,
  });

  args.option('check', {
    describe: 'only check to see if the specific revision requested is available to be restored',
    type: 'boolean',
    default: false,
  });

  return args.strict();
};

export const handler = lazyHandler(() => import('./restoreHandler'));
