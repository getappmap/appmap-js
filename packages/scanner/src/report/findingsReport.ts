import { Metadata } from '@appland/models';
import chalk from 'chalk';
import { ideLink } from '../rules/lib/util';
import { Finding } from '../types';

function writeln(text = ''): void {
  process.stdout.write(text);
  process.stdout.write('\n');
}

export default function (
  findings: Finding[],
  appMapMetadata: Record<string, Metadata>,
  ide?: string
): void {
  if (findings.length === 0) {
    return;
  }
  console.log();
  findings.forEach((finding) => {
    const filePath =
      ide && finding.appMapFile
        ? ideLink(finding.appMapFile, ide, finding.event.id)
        : finding.appMapFile;
    let eventMsg = `\tEvent:\t${finding.event.id} - ${finding.event.toString()}`;
    if (finding.event.elapsedTime !== undefined) {
      eventMsg += ` (${finding.event.elapsedTime}s)`;
    }

    const message = finding.message;
    writeln(chalk.magenta(message));
    writeln(`\tLink:\t${chalk.blue(filePath)}`);
    writeln(`\tRule:\t${finding.ruleId}`);
    writeln(`\tAppMap name:\t${appMapMetadata[finding.appMapFile].name}`);
    writeln(eventMsg);
    writeln(`\tScope:\t${finding.scope.id} - ${finding.scope.toString()}`);
    writeln();
  });
}
