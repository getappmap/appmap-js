import Assertion from '../assertion';
import { AppMap } from '@appland/models';
import chalk from 'chalk';
import { Finding } from '../types';

export default abstract class Formatter {
  abstract appMap(appMap: AppMap): string;
  abstract result(assertion: Assertion, findings: Finding[], index: number): string | undefined;

  summary(
    unmatched: number,
    _skipped: number,
    matched: number,
    titledSummary: Map<string, number>
  ): string {
    const total = unmatched + matched;
    const passedStr = chalk.green(`${unmatched} unmatched`);
    const matchedStr = chalk.magenta(`${matched} matched`);

    const result: Array<string> = [];
    result.push(`${total} assertions (${[passedStr, matchedStr].join(', ')})`);

    titledSummary.forEach((value: number, key: string) => {
      result.push(chalk.magenta(`\t- ${key}: ${value} case(s)`));
    });

    return result.join('\n');
  }
}
