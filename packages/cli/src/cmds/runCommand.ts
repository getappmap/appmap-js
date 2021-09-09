import ValidationError from './validationError';
import AbortError from './abortError';
import { verbose } from '../utils';
import UI from './userInteraction';
import chalk from 'chalk';

export default function runCommand(fn: () => Promise<any>) {
  fn().catch((err) => {
    if (err instanceof ValidationError) {
      console.warn(err.message);
      return process.exit(1);
    }
    if (err instanceof AbortError) {
      return process.exit(2);
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
  });
}
