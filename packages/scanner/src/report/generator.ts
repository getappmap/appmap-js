import * as fs from 'fs';
import ErrnoException = NodeJS.ErrnoException;
import chalk from 'chalk';
import { ideLink } from '../scanner/util';
import { Finding } from '../types';
import Formatter from '../formatter/formatter';

export type ReportType = 'text' | 'json';
type ReportingLevel = 'error' | 'warning' | 'log';

export default class Generator {
  constructor(
    private formatter: Formatter,
    private reportType: ReportType,
    private reportFile: string | undefined,
    private ide: string | undefined
  ) {}

  generate(findings: Finding[], totalAssertions: number): void {
    if (this.reportType === 'text') {
      this.writeln();
    }

    const titledSummary = new Map<string, number>();

    if (findings.length > 0) {
      if (this.reportType === 'text') {
        this.writeln(`${findings.length} findings:`);
      }

      findings.forEach((match) => {
        titledSummary.set(match.scannerTitle, (titledSummary.get(match.scannerTitle) ?? 0) + 1);

        const filePath =
          this.ide && match.appMapFile
            ? ideLink(match.appMapFile, this.ide, match.event.id)
            : match.appMapFile;
        let eventMsg = `\tEvent:\t${match.event.id} - ${match.event.toString()}`;
        if (match.event.elapsedTime !== undefined) {
          eventMsg += ` (${match.event.elapsedTime}s)`;
        }

        if (this.reportType === 'text') {
          this.write(`${chalk.magenta(match.message || match.condition)}`);
          this.write(`\tLink:\t${chalk.blue(filePath)}`);
          this.write(`\tRule:\t${match.scannerId}`);
          this.write(`\tAppMap name:\t${match.appMapName}`);
          this.writeln(eventMsg);
        }
      });
    }

    if (this.reportType === 'text') {
      this.write(this.formatter.summary(totalAssertions, findings.length, titledSummary));
    }

    if (this.reportType === 'json') {
      this.write(JSON.stringify(findings, null, 2));
    }
  }

  private write(text: string, level: ReportingLevel = 'log'): void {
    this.writeText(text, level);
  }

  private writeln(text = '', level: ReportingLevel = 'log'): void {
    this.writeText(text + '\n', level);
  }

  private writeText(text: string, level: ReportingLevel): void {
    if (this.reportType === 'json' && this.reportFile) {
      fs.writeFileSync(this.reportFile, text);
      return;
    }

    switch (level) {
      case 'error':
        console.error(text);
        break;
      case 'warning':
        console.warn(text);
        break;
      default:
        console.log(text);
    }
  }
}
