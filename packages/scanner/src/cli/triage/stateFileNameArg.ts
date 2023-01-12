import { Argv } from 'yargs';

export function stateFileNameArg(args: Argv<{}>): void {
  args.option('state-file', {
    describe: 'Name of the file containing the findings state',
    type: 'string',
    default: 'appmap-findings-state.yml',
  });
}
