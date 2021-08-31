import Assertion from '../assertion';
import { AppMapData } from '../../../appland/types';
import chalk from 'chalk';

export default abstract class Formatter {
  abstract appMap(appMap: AppMapData): string;
  abstract result(
    assertion: Assertion,
    result: Boolean | null,
    index: number
  ): string | undefined;

  summary(passed: number, skipped: number, failed: number): string {
    const total = passed + failed;
    const passedStr = chalk.green(`${passed} passed`);
    const failedStr = chalk.red(`${failed} failed`);

    return `${total} assertions (${[passedStr, failedStr].join(', ')})`;
  }
}
