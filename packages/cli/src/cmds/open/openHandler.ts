import { exists, verbose } from '../../utils';
import chalk from 'chalk';
import UI from '../userInteraction';
import runCommand from '../runCommand';
import showAppMap from './showAppMap';
import { ValidationError } from '../errors';

export default async function handler(argv) {
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

  return runCommand('open', commandFn);
}
