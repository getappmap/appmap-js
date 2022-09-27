import { exists, verbose } from '../../utils';
import chalk from 'chalk';
import UI from '../userInteraction';
import runCommand from '../runCommand';
import showAppMap from './showAppMap';
import { ValidationError } from '../errors';
import Telemetry from '../../telemetry';

export const command = 'open [appmap-file]';
export const describe = 'Open an AppMap in the system default browser';

export const builder = (args) => {
  args.positional('appmap-file', {
    describe: 'path to the AppMap to open.',
    type: 'string',
    default: undefined,
  });
  return args.strict();
};

export const handler = async (argv) => {
  verbose(argv.verbose);

  const commandFn = async () => {
    const { appmapFile } = argv;

    if (!appmapFile) {
      UI.error(`AppMap file argument is required.`);
      throw new ValidationError();
    }
    if (!(await exists(appmapFile))) {
      UI.error(`AppMap file ${chalk.red(appmapFile)} does not exist.`);
      throw new ValidationError();
    }

    await showAppMap(appmapFile);
  };

  Telemetry.sendEvent({
    name: `open:open`,
  });

  return runCommand('open', commandFn);
};
