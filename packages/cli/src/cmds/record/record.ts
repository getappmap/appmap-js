import { verbose } from '../../utils';
import runCommand from '../runCommand';
import { RequestOptions } from 'http';
import intro from './intro';
import configureConnection from './configureConnection';
import testConnection from './testConnection';
import createRecording from './createRecording';
import showAppMap from '../open/showAppMap';

export const command = 'record';
export const describe =
  'Create an AppMap via interactive recording, aka remote recording.';

export const builder = (args) => {
  return args.strict();
};

export const handler = async (argv) => {
  verbose(argv.verbose);

  const commandFn = async () => {
    await intro();

    let requestOptions: RequestOptions = {};

    await configureConnection(requestOptions);
    await testConnection(requestOptions);
    const appMapFile = await createRecording(requestOptions);
    await showAppMap(appMapFile);
  };

  return runCommand(commandFn);
};
