import Assertion from '../assertion';
import { AppMap } from '@appland/models';
import chalk from 'chalk';
import { AssertionFailure } from '../types';

export default abstract class Formatter {
  abstract appMap(appMap: AppMap): string;
  abstract result(
    assertion: Assertion,
    failures: AssertionFailure[],
    index: number
  ): string | undefined;

  summary(passed: number, skipped: number, failed: number): string {
    const total = passed + failed;
    const passedStr = chalk.green(`${passed} passed`);
    const failedStr = chalk.red(`${failed} failed`);

    return `${total} assertions (${[passedStr, failedStr].join(', ')})`;
  }
}
