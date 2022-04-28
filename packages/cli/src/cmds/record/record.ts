import { endTime, verbose } from '../../utils';
import runCommand from '../runCommand';
import showAppMap from '../open/showAppMap';
import yargs from 'yargs';
import { setAppMapConfigFilePath } from './configuration';
import { State } from './types/state';
import { FileName } from './types/fileName';
import { chdir } from 'process';

import initial from './state/initial';
import Telemetry from '../../telemetry';
import RecordContext from './recordContext';

export const command = 'record [mode]';
export const describe =
  'Create an AppMap via interactive recording, aka remote recording.';

export const builder = (args: yargs.Argv) => {
  args.positional('mode', {
    type: 'string',
    choices: ['test', 'remote'],
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

export async function handler(argv: any) {
  verbose(argv.verbose);

  const commandFn = async () => {
    const { directory, appmapConfig } = argv;
    if (directory) {
      if (verbose()) console.log(`Using working directory ${directory}`);
      chdir(directory);
    }

    if (appmapConfig) setAppMapConfigFilePath(appmapConfig);

    const recordContext = new RecordContext(directory || '.');
    await recordContext.initialize();

    const { mode } = argv;

    async function initialState(): Promise<State> {
      if (mode) {
        recordContext.recordMethod = mode;
        return (await import(`./state/record_${mode}`)).default as State;
      } else {
        return initial;
      }
    }

    let state: State | string | undefined = await initialState();
    while (state && typeof state === 'function') {
      if (verbose()) console.warn(`Entering state: ${state.name}`);

      let errorMessage: string | undefined;
      let newState: State | string | undefined;
      try {
        newState = await state(recordContext);
      } catch (err) {
        errorMessage = (err as any).toString();
        throw err;
      } finally {
        const properties = recordContext.properties();
        if (errorMessage) {
          properties.errorMessage = errorMessage;
        }
        Telemetry.sendEvent({
          name: `record:${state.name}`,
          properties,
          metrics: Object.assign(
            {
              duration: endTime(),
            },
            recordContext.metrics()
          ),
        });
      }

      state = newState;
    }

    if (typeof state === 'string') {
      Telemetry.sendEvent({
        name: `record:showAppMap`,
        properties: {
          fileName: state as FileName,
        },
        metrics: {
          duration: endTime(),
        },
      });

      await showAppMap(state as FileName);
    }
  };

  return runCommand('record', commandFn);
}
