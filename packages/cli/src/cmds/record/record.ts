import { verbose } from '../../utils';
import runCommand from '../runCommand';
import { RequestOptions } from 'http';
import intro from './intro';
import configureConnection from './configureConnection';
import createRecording from './createRecording';
import showAppMap from '../open/showAppMap';
import yargs from 'yargs';
import { setAppMapFile } from './configuration';

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
  if (argv.appmapConfig) setAppMapFile(argv.appmapConfig);

  const commandFn = async () => {
    await intro();

    let requestOptions: RequestOptions = {};

    await configureConnection(requestOptions);
    const appMapFile = await createRecording(requestOptions);
    if (appMapFile) {
      await showAppMap(appMapFile);
    }
  };

  return runCommand(commandFn);
};
