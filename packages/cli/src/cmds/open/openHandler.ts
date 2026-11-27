import { constants, promises as fs } from 'fs';
import { isNodeError, verbose } from '../../utils';
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
    try {
      await fs.access(appmapFile, constants.R_OK);
    } catch (error) {
      if (isNodeError(error, 'ENOENT')) {
        throw new ValidationError(`AppMap file ${chalk.red(appmapFile)} does not exist.`);
      }
      if (isNodeError(error) && error.code) throw new ValidationError(error.message);
      throw error;
    }

    await showAppMap(appmapFile);
  };

  return runCommand('open', commandFn);
}
