import * as fs from 'fs';
import chalk from 'chalk';
import { ideLink } from '../scanner/util';
import { Finding } from '../types';
import Formatter from '../formatter/formatter';

export type ReportType = 'text' | 'json';

export default class Generator {
  private fileCreated = false;

  constructor(
    private formatter: Formatter,
    private reportType: ReportType,
    private reportFile: string | undefined,
    private ide: string | undefined
  ) {}

  generate(findings: Finding[], totalAssertions: number): string {
    if (this.reportType === 'text' && !this.reportFile) {
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
          const message = match.message || match.condition;
          this.writeln(this.reportFile ? message : chalk.magenta(message));
          this.writeln(`\tLink:\t${this.reportFile ? filePath : chalk.blue(filePath)}`);
          this.writeln(`\tRule:\t${match.scannerId}`);
          this.writeln(`\tAppMap name:\t${match.appMapName}`);
          this.writeln(eventMsg);
          this.writeln();
        }
      });
    }

    const colouredSummary = this.formatter.summary(totalAssertions, findings.length, titledSummary);
    this.formatter.disableColors();
    const summary = this.formatter.summary(totalAssertions, findings.length, titledSummary);

    if (this.reportType === 'text') {
      this.write(this.reportFile ? summary : colouredSummary);
    }

    if (this.reportType === 'json') {
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
