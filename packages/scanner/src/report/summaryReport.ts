import chalk from 'chalk';

import { Finding } from '../types';
import { pluralize } from '../rules/lib/util';

import { FindingSummary } from './findingSummary';
import { ScanResults } from './scanResults';

function summarizeFindings(findings: Finding[]): FindingSummary[] {
  const result = findings.reduce((memo, finding) => {
    let findingSummary = memo[finding.ruleId];
    if (findingSummary) {
      findingSummary.findingTotal += 1;
      if (!findingSummary.findingHashes.has(finding.hash)) {
        findingSummary.findingHashes.add(finding.hash);
        findingSummary.messages.push(finding.message);
      }
    } else {
      findingSummary = {
        ruleId: finding.ruleId,
        ruleTitle: finding.ruleTitle,
        findingTotal: 1,
        findingHashes: new Set([finding.hash]),
        messages: [finding.message],
      } as FindingSummary;
      memo[finding.ruleId] = findingSummary;
    }
    return memo;
  }, {} as Record<string, FindingSummary>);
  Object.values(result).forEach(
    (findingSummary) => (findingSummary.messages = findingSummary.messages.sort())
  );
  return Object.values(result);
}

export default function (summary: ScanResults, colorize: boolean): void {
  const matchedStr = `${summary.summary.numFindings} ${pluralize(
    'finding',
    summary.summary.numFindings
  )} (${new Set(summary.findings.map((finding) => finding.hash)).size} unique)`;
  const colouredMatchedStr = colorize ? chalk.stderr.magenta(matchedStr) : matchedStr;

  console.log();
  console.log(colouredMatchedStr);

  summarizeFindings(summary.findings)
    .sort((a, b) => a.ruleTitle.localeCompare(b.ruleTitle))
    .forEach((finding) => {
      const casesStr = `\t- ${finding.ruleTitle} (${finding.ruleId}) : ${
        finding.findingTotal
      } ${pluralize('case', finding.findingTotal)} (${finding.findingHashes.size} unique)`;
      console.log(colorize ? chalk.stderr.magenta(casesStr) : casesStr);
      finding.messages.forEach((message) => {
        const messageStr = `\t\t${message}`;
        console.log(colorize ? chalk.stderr.magenta(messageStr) : messageStr);
      });
    });
}
