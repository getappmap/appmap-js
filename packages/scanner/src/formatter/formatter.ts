import { AppMap } from '@appland/models';
import chalk from 'chalk';
import { AssertionPrototype, Finding } from '../types';

export default abstract class Formatter {
  private noColors = false;

  abstract appMap(appMap: AppMap): string;
  abstract result(
    assertionPrototype: AssertionPrototype,
    findings: Finding[],
    index: number
  ): string | undefined;

  summary(total: number, findings: number, titledSummary: Map<string, number>): string {
    const matchedStr = `${findings} finding${findings === 1 ? '' : 's'}`;
    const colouredMatchedStr = this.noColors ? matchedStr : chalk.stderr.magenta(matchedStr);

    const result: Array<string> = [];
    result.push(`${total} checks (${[colouredMatchedStr].join(', ')})`);

    titledSummary.forEach((value: number, key: string) => {
      const casesStr = `\t- ${key}: ${value} case(s)`;
      result.push(this.noColors ? casesStr : chalk.stderr.magenta(casesStr));
    });

    return result.join('\n');
  }

  disableColors(): void {
    this.noColors = true;
  }
}
