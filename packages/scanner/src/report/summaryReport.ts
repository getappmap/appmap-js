import chalk from 'chalk';
import { FindingSummary } from 'src/report/findingSummary';
import { ScanResults } from './scanResults';
import { Finding } from '../types';

function summarizeFindings(findings: Finding[]): FindingSummary[] {
  const result = findings.reduce((memo, finding) => {
    let findingSummary = memo[finding.ruleId];
    if (findingSummary) {
      findingSummary.findingTotal += 1;
      findingSummary.messages.add(finding.message);
    } else {
      findingSummary = {
        ruleId: finding.ruleId,
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

export default function (summary: ScanResults, colorize: boolean): void {
  const matchedStr = `${summary.summary.numFindings} finding${
    summary.summary.numFindings === 1 ? '' : 's'
  }`;
  const colouredMatchedStr = colorize ? chalk.stderr.magenta(matchedStr) : matchedStr;

  console.log();
  console.log(`${summary.summary.numChecks} checks (${[colouredMatchedStr].join(', ')})`);

  summarizeFindings(summary.findings)
    .sort((a, b) => a.ruleTitle.localeCompare(b.ruleTitle))
    .forEach((finding) => {
      const casesStr = `\t- ${finding.ruleTitle} (${finding.ruleId}) : ${finding.findingTotal} case(s)`;
      console.log(colorize ? chalk.stderr.magenta(casesStr) : casesStr);
      const uniqueMessages = [...new Set(finding.messages)].sort();
      uniqueMessages.forEach((message) => {
        const messageStr = `\t\t${message}`;
        console.log(colorize ? chalk.stderr.magenta(messageStr) : messageStr);
      });
    });
}
