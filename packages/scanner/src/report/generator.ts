import * as fs from 'fs';
import chalk from 'chalk';
import { ideLink } from '../scanner/util';
import { Finding, ScannerSummary } from '../types';
import Formatter from '../formatter/formatter';

export type ReportFormat = 'text' | 'json';

export default class Generator {
  private fileCreated = false;

  constructor(
    private formatter: Formatter,
    private reportFormat: ReportFormat,
    private reportFile: string | undefined,
    private ide: string | undefined
  ) {}

  generate(findings: Finding[], totalAssertions: number): string {
    if (this.reportFormat === 'text' && !this.reportFile) {
      this.writeln();
    }

    const scannerSummary: ScannerSummary = {
      checkTotal: totalAssertions,
      findingTotal: findings.length,
      findingSummary: {},
    };

    if (findings.length > 0) {
      if (this.reportFormat === 'text') {
        this.writeln(`${findings.length} findings:`);
      }

      findings.forEach((match) => {
        let findingSummary = scannerSummary.findingSummary[match.scannerId];
        if (!findingSummary) {
          findingSummary = {
            scannerTitle: match.scannerTitle,
            findingTotal: 0,
            messages: new Set(),
          };
          scannerSummary.findingSummary[match.scannerId] = findingSummary;
        }
        findingSummary.findingTotal += 1;
        if (match.message) {
          findingSummary.messages.add(match.message);
        }

        const filePath =
          this.ide && match.appMapFile && !this.reportFile
            ? ideLink(match.appMapFile, this.ide, match.event.id)
            : match.appMapFile;
        let eventMsg = `\tEvent:\t${match.event.id} - ${match.event.toString()}`;
        if (match.event.elapsedTime !== undefined) {
          eventMsg += ` (${match.event.elapsedTime}s)`;
        }

        if (this.reportFormat === 'text') {
          const message = match.message || match.condition;
          this.writeln(this.reportFile ? message : chalk.magenta(message));
          this.writeln(`\tLink:\t${this.reportFile ? filePath : chalk.blue(filePath)}`);
          this.writeln(`\tRule:\t${match.scannerId}`);
          this.writeln(`\tAppMap name:\t${match.appMapName}`);
          this.writeln(eventMsg);
          this.writeln(`\tScope:\t${match.scope.id} - ${match.scope.toString()}`);
          this.writeln();
        }
      });
    }

    const colouredSummary = this.formatter.summary(scannerSummary);
    this.formatter.disableColors();
    const summary = this.formatter.summary(scannerSummary);

    if (this.reportFormat === 'text') {
      this.write(this.reportFile ? summary : colouredSummary);
    }

    if (this.reportFormat === 'json') {
      this.write(JSON.stringify(findings, null, 2));
    }

    return summary;
  }

  private write(text: string): void {
    this.writeText(text);
  }

  private writeln(text = ''): void {
    this.writeText(text + '\n');
  }

  private writeText(text: string): void {
    if (this.reportFile) {
      const options = this.fileCreated ? { flag: 'a+' } : {};
      fs.writeFileSync(this.reportFile, text, options);

      if (!this.fileCreated) {
        this.fileCreated = true;
      }

      return;
    }

    process.stdout.write(text);
  }
}
