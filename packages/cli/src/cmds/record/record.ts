import { verbose } from '../../utils';
import runCommand from '../runCommand';
import showAppMap from '../open/showAppMap';
import yargs from 'yargs';
import { setAppMapConfigFilePath } from './configuration';
import { State } from './types/state';
import { FileName } from './types/fileName';
import { chdir } from 'process';

export const command = 'record [mode]';
export const describe =
  'Create an AppMap via interactive recording, aka remote recording.';

export const builder = (args: yargs.Argv) => {
  args.positional('mode', {
    type: 'string',
    choices: ['test', 'remote'],
    default: 'remote',
    required: true,
  });

  args.option('directory', {
    describe: 'Working directory for the command.',
    type: 'string',
    alias: 'd',
  });

  args.option('appmap-config', {
    describe: 'AppMap config file to check for default options.',
    type: 'string',
    alias: 'c',
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);

  const commandFn = async () => {
    const { directory, appmapConfig } = argv;
    if (directory) {
      if (verbose()) console.log(`Using working directory ${directory}`);
      chdir(directory);
    }

    if (appmapConfig) setAppMapConfigFilePath(appmapConfig);

    const { mode } = argv;
    let state: State | string | undefined = (
      await import(`./state/record_${mode}`)
    ).default as State;

    while (state && typeof state === 'function') {
      if (verbose()) console.warn(`Entering state: ${state.name}`);
      const newState = await state();
      state = newState;
    }

    if (typeof state === 'string') {
      await showAppMap(state as FileName);
    }
  };

  return runCommand(commandFn);
};
