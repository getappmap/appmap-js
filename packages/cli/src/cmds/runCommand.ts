import { AbortError, ValidationError } from './errors';
import { verbose } from '../utils';
import UI from './userInteraction';
import chalk from 'chalk';
import { ExitCode } from './record/types/exitCode';
import { Telemetry } from '@appland/telemetry';

export default async function runCommand(
  commandPrefix: string,
  fn: () => Promise<any>
): Promise<void> {
  try {
    const ret = await fn();

    process.exitCode = 0;
    return ret;
  } catch (err) {
    if (err instanceof ValidationError) {
      console.warn(err.message);

      process.exitCode = ExitCode.Error;
    } else if (err instanceof AbortError) {
      process.exitCode = ExitCode.Quit;
    } else if (err instanceof Error) {
      Telemetry.sendEvent({
        name: `${commandPrefix}:error`,
        properties: {
          errorMessage: err.message,
          errorStack: err.stack,
        },
      });

      if (verbose()) {
        UI.error(err);
      } else {
        UI.error(`An error occurred: ${err.toString().split('\n')[0]}`);
        UI.error(
          `Try re-running the command with the ${chalk.red('verbose')} flag (${chalk.red('-v')}).`
        );
      }
      process.exitCode = ExitCode.Error;
    } else {
      // You'll wind up here if the object thrown wasn't an instance of Error. An obvious way this
      // can happen is `throw 'Fail'`. A less obvious way is rejecting a Promise with something
      // other than an error, e.g. `reject('Fail')`.
      throw err;
    }
  }
}
