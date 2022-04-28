import { Argv } from 'yargs';

export default function (args: Argv): void {
  args.option('branch', {
    describe: 'branch name of the code version',
    alias: 'b',
  });
  args.option('commit', {
    describe: 'commit SHA of the code version',
    alias: 'C',
  });
  args.option('environment', {
    describe:
      'name of the environment in which the scan is performed (e.g. $HOSTNAME, ci, staging, etc)',
    alias: 'e',
  });
}
