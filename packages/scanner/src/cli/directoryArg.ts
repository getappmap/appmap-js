import { Argv } from 'yargs';

export function directoryArg(args: Argv<{}>): void {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
}
