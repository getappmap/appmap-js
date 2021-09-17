import { AbortError, ValidationError } from './agentInstaller/errors';
import { verbose } from '../utils';
import UI from './agentInstaller/userInteraction';
import chalk from 'chalk';
import Yargs from 'yargs';

export default async function runCommand(fn: () => Promise<any>) {
  return fn().catch((err) => {
    if (err instanceof ValidationError) {
      console.warn(err.message);
      return Yargs.exit(1, err);
    }
    if (err instanceof AbortError) {
      return Yargs.exit(2, err);
    }

    if (verbose()) {
      UI.error(err);
    } else {
      UI.error(`An error occurred: ${err.toString().split('\n')[0]}`);
      UI.error(
        `Try re-running the command with the ${chalk.red(
          'verbose'
        )} flag (${chalk.red('-v')}).`
      );
    }
    Yargs.exit(3, err);
  });
}
