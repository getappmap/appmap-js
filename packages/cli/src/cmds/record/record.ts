import { verbose } from '../../utils';
import runCommand from '../runCommand';
import showAppMap from '../open/showAppMap';
import yargs from 'yargs';
import { setAppMapConfigFilePath } from './configuration';
import initial from './state/initial';
import { State } from './types/state';
import { FileName } from './types/fileName';

export const command = 'record';
export const describe =
  'Create an AppMap via interactive recording, aka remote recording.';

export const builder = (args: yargs.Argv) => {
  args.option('appmap-config', {
    describe: 'AppMap config file to check for default options.',
    type: 'string',
    alias: 'c',
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);
  if (argv.appmapConfig) setAppMapConfigFilePath(argv.appmapConfig);

  const commandFn = async () => {
    let state: State | undefined = initial;

    while (state && typeof state === 'function') {
      const newState = await state();
      state = newState;
    }

    if (typeof state === 'string') {
      await showAppMap(state as FileName);
    }
  };

  return runCommand(commandFn);
};
