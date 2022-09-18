import { AbortError, ValidationError } from './errors';
import { verbose } from '../utils';
import UI from './userInteraction';
import chalk from 'chalk';
import Yargs, { command } from 'yargs';
import { ExitCode } from './record/types/exitCode';
import Telemetry from '../telemetry';

async function invokeCommand() {}

function flushTelemetry(exitCode: ExitCode, err?: Error) {
  Telemetry.flush(() => {
    // @types/yargs defines:
    //   exit(code: number, err: Error): void;
    // but in the implementation, err appears to be optional.
    Yargs.exit(exitCode, err as any);
  });
}

export default async function runCommand(
  commandPrefix: string,
  fn: () => Promise<any>
): Promise<void> {
  try {
    await fn();

    Telemetry.sendEvent({
      name: `${commandPrefix}:exit-ok`,
    });

    flushTelemetry(0);
  } catch (err) {
    if (err instanceof ValidationError) {
      console.warn(err.message);

      Telemetry.sendEvent({
        name: `${commandPrefix}:validation-error`,
        properties: {
          error: err.message,
        },
      });

      return flushTelemetry(ExitCode.Error, err);
    } else if (err instanceof AbortError) {
      Telemetry.sendEvent({
        name: `${commandPrefix}:abort`,
        properties: {
          error: err.message,
        },
      });

      return flushTelemetry(ExitCode.Quit, err);
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
      flushTelemetry(ExitCode.Error, err);
    } else {
      // You'll wind up here if the object thrown wasn't an instance of Error. An obvious way this
      // can happen is `throw 'Fail'`. A less obvious way is rejecting a Promise with something
      // other than an error, e.g. `reject('Fail')`.
      throw err;
    }
  }
}
