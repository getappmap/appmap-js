import { AppMap } from '@appland/models';
import chalk from 'chalk';
import { ScannerSummary } from 'src/report/scannerSummary';
import { AssertionPrototype, Finding } from '../types';

export default abstract class Formatter {
  private noColors = false;

  abstract appMap(appMap: AppMap): string;
  abstract result(
    assertionPrototype: AssertionPrototype,
    findings: Finding[],
    index: number
  ): string | undefined;

  summary(summary: ScannerSummary): string {
    const matchedStr = `${summary.findingTotal} finding${summary.findingTotal === 1 ? '' : 's'}`;
    const colouredMatchedStr = this.noColors ? matchedStr : chalk.stderr.magenta(matchedStr);

    const result: Array<string> = [];
    result.push(`${summary.checkTotal} checks (${[colouredMatchedStr].join(', ')})`);

    Object.values(summary.findingSummary)
      .sort((a, b) => a.scannerTitle.localeCompare(b.scannerTitle))
      .forEach((findingSummary) => {
        const casesStr = `\t- ${findingSummary.scannerTitle}: ${findingSummary.findingTotal} case(s)`;
        result.push(this.noColors ? casesStr : chalk.stderr.magenta(casesStr));
        const uniqueMessages = [...new Set(findingSummary.messages)].sort();
        uniqueMessages.forEach((message) => {
          const messageStr = `\t\t${message}`;
          result.push(this.noColors ? messageStr : chalk.stderr.magenta(messageStr));
        });
      });

    result.push('');

    return result.join('\n');
  }

  disableColors(): void {
    this.noColors = true;
  }
}
