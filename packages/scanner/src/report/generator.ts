import * as fs from 'fs';
import chalk from 'chalk';
import { ideLink } from '../rules/util';
import { Finding } from '../types';
import Formatter from '../formatter/formatter';
import { ScanResults } from './scanResults';
import { Metadata } from '@appland/models';

export type ReportFormat = 'text' | 'json';

export default class Generator {
  private fileCreated = false;

  constructor(
    private formatter: Formatter,
    private reportFormat: ReportFormat,
    private reportFile: string | undefined,
    private ide: string | undefined
  ) {}

  generate(
    scanSummary: ScanResults,
    findings: Finding[],
    appMapMetadata: Record<string, Metadata>
  ): string {
    if (this.reportFormat === 'text' && !this.reportFile) {
      this.writeln();
    }

    if (findings.length > 0) {
      if (this.reportFormat === 'text') {
        this.writeln(`${findings.length} findings:`);
      }

      findings.forEach((finding) => {
        const filePath =
          this.ide && finding.appMapFile && !this.reportFile
            ? ideLink(finding.appMapFile, this.ide, finding.event.id)
            : finding.appMapFile;
        let eventMsg = `\tEvent:\t${finding.event.id} - ${finding.event.toString()}`;
        if (finding.event.elapsedTime !== undefined) {
          eventMsg += ` (${finding.event.elapsedTime}s)`;
        }

        if (this.reportFormat === 'text') {
          const message = finding.message;
          this.writeln(this.reportFile ? message : chalk.magenta(message));
          this.writeln(`\tLink:\t${this.reportFile ? filePath : chalk.blue(filePath)}`);
          this.writeln(`\tRule:\t${finding.ruleId}`);
          this.writeln(`\tAppMap name:\t${appMapMetadata[finding.appMapFile].name}`);
          this.writeln(eventMsg);
          this.writeln(`\tScope:\t${finding.scope.id} - ${finding.scope.toString()}`);
          if (finding.relatedEvents) {
            this.writeln(`\tRelated events:`);
            for (const event of finding.relatedEvents) {
              this.writeln(`\t\t${event.id} - ${event.codeObject.packageOf}/${event.toString()}`);
            }
          }
          this.writeln();
        }
      });
    }

    const colouredSummary = this.formatter.summary(scanSummary);
    this.formatter.disableColors();
    const summary = this.formatter.summary(scanSummary);

    if (this.reportFormat === 'text') {
      this.write(this.reportFile ? summary : colouredSummary);
    }

    if (this.reportFormat === 'json') {
      this.write(JSON.stringify(scanSummary, null, 2));
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
