import { AppMap } from '@appland/models';
import chalk from 'chalk';
import { FindingSummary } from 'src/report/findingSummary';
import Check from '../check';
import { ScanResults } from '../report/scanResults';
import { Finding } from '../types';

function summarizeFindings(findings: Finding[]): FindingSummary[] {
  const result = findings.reduce((memo, finding) => {
    let findingSummary = memo[finding.ruleId];
    if (findingSummary) {
      findingSummary.findingTotal += 1;
      findingSummary.messages.add(finding.message);
    } else {
      findingSummary = {
        ruleTitle: finding.ruleTitle,
        findingTotal: 1,
        messages: new Set([finding.message]),
      } as FindingSummary;
      memo[finding.ruleId] = findingSummary;
    }
    return memo;
  }, {} as Record<string, FindingSummary>);
  return Object.values(result);
}

export default abstract class Formatter {
  private noColors = false;

  abstract appMap(appMap: AppMap): string;
  abstract result(check: Check, findings: Finding[], index: number): string | undefined;

  summary(summary: ScanResults): string {
    const matchedStr = `${summary.summary.numFindings} finding${
      summary.summary.numFindings === 1 ? '' : 's'
    }`;
    const colouredMatchedStr = this.noColors ? matchedStr : chalk.stderr.magenta(matchedStr);

    const result: Array<string> = [];
    result.push(`${summary.summary.numChecks} checks (${[colouredMatchedStr].join(', ')})`);

    summarizeFindings(summary.findings)
      .sort((a, b) => a.ruleTitle.localeCompare(b.ruleTitle))
      .forEach((findingSummary) => {
        const casesStr = `\t- ${findingSummary.ruleTitle}: ${findingSummary.findingTotal} case(s)`;
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
