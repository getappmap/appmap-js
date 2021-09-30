import Assertion from '../assertion';
import { AppMap } from '@appland/models';
import chalk from 'chalk';
import { Finding } from '../types';

export default abstract class Formatter {
  abstract appMap(appMap: AppMap): string;
  abstract result(assertion: Assertion, findings: Finding[], index: number): string | undefined;

  summary(total: number, findings: number, titledSummary: Map<string, number>): string {
    const matchedStr = chalk.magenta(`${findings} finding${findings === 1 ? '' : 's'}`);

    const result: Array<string> = [];
    result.push(`${total} checks (${[matchedStr].join(', ')})`);

    titledSummary.forEach((value: number, key: string) => {
      result.push(chalk.magenta(`\t- ${key}: ${value} case(s)`));
    });

    return result.join('\n');
  }
}
