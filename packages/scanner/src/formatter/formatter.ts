import Assertion from '../assertion';
import { AppMap } from '@appland/models';
import chalk from 'chalk';
import { AssertionMatch } from '../types';

export default abstract class Formatter {
  abstract appMap(appMap: AppMap): string;
  abstract result(
    assertion: Assertion,
    matches: AssertionMatch[],
    index: number
  ): string | undefined;

  summary(unmatched: number, _skipped: number, matched: number): string {
    const total = unmatched + matched;
    const passedStr = chalk.green(`${unmatched} unmatched`);
    const matchedStr = chalk.magenta(`${matched} matched`);

    return `${total} assertions (${[passedStr, matchedStr].join(', ')})`;
  }
}
