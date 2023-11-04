import { join } from 'path';
import assert from 'assert';
import { existsSync } from 'fs';

import { Report } from '../inventory/Report';
import { AppMapConfig } from '../../lib/loadAppMapConfig';
import WelcomeReporter from './WelcomeReporter';
import SummaryReporter from './SummaryReporter';

export const TemplateDirectory = [
  '../../../resources/inventory-report', // As packaged
  '../../../../resources/inventory-report', // In development
]
  .map((dirName) => join(__dirname, dirName))
  .find((dirName) => existsSync(dirName));

assert(TemplateDirectory, "Report template directory 'inventory-report' not found");

enum TemplateName {
  Welcome = 'welcome',
  Summary = 'summary',
}

export default function buildReporter(
  templateName: TemplateName,
  appmapURL: string,
  sourceURL?: string
): Reporter {
  let report: Reporter;
  switch (templateName) {
    case TemplateName.Welcome:
      report = new WelcomeReporter(appmapURL, sourceURL);
      break;
    case TemplateName.Summary:
      const summaryReport = new SummaryReporter(appmapURL, sourceURL);
      report = summaryReport;
      break;
  }
  return report;
}

export interface Reporter {
  generateReport(report: Report, appmapConfig: AppMapConfig): Promise<string>;
}
