import { verbose } from '../../utils';
import runCommand from '../runCommand';
import showAppMap from '../open/showAppMap';
import { State } from './types/state';
import { chdir } from 'process';

import initial, { createState as createInitialState } from './state/initial';
import RecordContext from './recordContext';
import Configuration from './configuration';
import statsHandler from '../stats/statsHandler';
import openTicket from '../../lib/ticket/openTicket';
import UI from '../userInteraction';
import { RemoteRecordingError } from './makeRequest';
import chalk from 'chalk';
import { existsSync as fsExistsSync, statSync as fsStatSync } from 'fs';

export default async function handler(argv: any) {
  verbose(argv.verbose);

  const commandFn = async () => {
    const { directory, appmapConfig } = argv;
    if (directory) {
      if (verbose()) console.log(`Using working directory ${directory}`);

      if (fsExistsSync(directory)) {
        // statSync follows symlinks
        if (!fsStatSync(directory).isDirectory()) {
          UI.error(`${directory} is not a directory.`);
          return null;
        }
      } else {
        UI.error(`Directory ${directory} does not exist.`);
        return null;
      }

      chdir(directory);
    }

    const configuration = new Configuration(appmapConfig);
    const recordContext = new RecordContext(configuration);
    await recordContext.initialize();

    const { mode } = argv;

    async function initialState(): Promise<State> {
      if (mode) {
        recordContext.recordMethod = mode;
        return createInitialState(mode);
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
        // TODO: consider making this more general, to open a ticket when any Error occurs.
        if (err instanceof RemoteRecordingError) {
          // If a request to the remote-recording endpoint fails, an AppMap won't be created, i.e.
          // the final AppMap count will match the initial count.
          recordContext.appMapCount = recordContext.initialAppMapCount;
          await handleRemoteError(err);
          break;
        }
        throw err;
      } finally {
        const properties = recordContext.properties();
        if (errorMessage) {
          properties.errorMessage = errorMessage;
        }
      }

      state = newState;
    }

    if (typeof state === 'string') {
      await showAppMap(state);
    }

    await statsHandler(argv, 'from_record');
  };

  return runCommand('record', commandFn);
}

async function handleRemoteError(err: RemoteRecordingError) {
  UI.error(`Something went wrong when ${err.description}:
HTTP status: ${err.statusCode}
HTTP request: ${err.method} ${err.path}
`);

  const message = `Would you like to see the server's response?`;

  const result = await UI.prompt(
    {
      name: 'showResponse',
      type: 'confirm',
      message,
      prefix: chalk.red('!'),
    },
    { supressSpinner: true }
  );
  const { showResponse } = result;

  if (showResponse) {
    UI.error(err.message);
  }

  await openTicket(err.toString());
}
