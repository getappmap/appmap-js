import Handlebars from 'handlebars';
import { join } from 'path';
import { readFile } from 'fs/promises';
import assert from 'assert';
import { existsSync } from 'fs';

import { Report } from '../inventory/Report';
import helpers from '../compare-report/helpers';
import { AppMapConfig, ConfiguredPackage } from '../../lib/loadAppMapConfig';
import { App } from '@appland/client';

const TemplateDirectory = [
  '../../../resources/inventory-report', // As packaged
  '../../../../resources/inventory-report', // In development
]
  .map((dirName) => join(__dirname, dirName))
  .find((dirName) => existsSync(dirName));
assert(TemplateDirectory, "Report template directory 'inventory-report' not found");

enum TemplateName {
  Welcome = 'welcome',
}

export default async function generateReport(
  templateName: TemplateName,
  report: Report,
  appmapConfig: AppMapConfig
): Promise<string> {
  let reportTemplate: MarkdownReport;
  switch (templateName) {
    case TemplateName.Welcome:
      reportTemplate = new WelcomeReport();
      break;
  }

  return reportTemplate.generateReport(report, appmapConfig);
}

type AugmentedReportData = Report & { appmapConfig: AppMapConfig };

export interface MarkdownReport {
  generateReport(report: Report, appmapConfig: AppMapConfig): Promise<string>;
}

export class WelcomeReport implements MarkdownReport {
  async generateReport(reportData: Report, appmapConfig: AppMapConfig): Promise<string> {
    assert(TemplateDirectory);
    const templateFile = join(TemplateDirectory, 'welcome', 'welcome.hbs');
    const template = await ReportTemplate.build(templateFile);

    const data: AugmentedReportData = { ...reportData, appmapConfig };
    return template.generateMarkdown(data);
  }
}

export class ReportTemplate {
  constructor(public template: HandlebarsTemplateDelegate) {}

  generateMarkdown(data: AugmentedReportData): string {
    return this.template(data, {
      helpers: ReportTemplate.helpers(),
      allowProtoPropertiesByDefault: true,
    });
  }

  static helpers(): { [name: string]: Function } | undefined {
    const select_values_by_key_range = (
      data: Record<number, number>,
      keyMin: number,
      keyMax?: number
    ): number[] => {
      if (typeof keyMax === 'object') keyMax = undefined;
      const result = Object.keys(data)
        .map((k) => parseInt(k, 10))
        .filter((k) => k >= keyMin && (keyMax === undefined || k < keyMax))
        .map((k) => data[k]);
      return result;
    };

    const sum_values_by_key_range = (
      data: Record<number, number>,
      keyMin: number,
      keyMax?: number
    ): number => {
      const values = select_values_by_key_range(data, keyMin, keyMax);
      return values.reduce((a, b) => a + (b || 0), 0);
    };

    const packages_matching_configuration = (
      packages: string[],
      configuredPackages: ConfiguredPackage[]
    ) => {
      const normalizePackage = (pkg: string) => pkg.replace(/\//g, '.').toLowerCase();

      return packages.filter((pkg) => {
        return configuredPackages.find((configuredPackage) =>
          normalizePackage(pkg).startsWith(normalizePackage(configuredPackage.path))
        );
      });
    };

    return {
      packages_matching_configuration,
      select_values_by_key_range,
      sum_values_by_key_range,
      ...helpers,
    };
  }

  static async build(templateFile: string): Promise<ReportTemplate> {
    const template = Handlebars.compile(await readFile(templateFile, 'utf8'));
    return new ReportTemplate(template);
  }
}
