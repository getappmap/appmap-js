import { join } from 'path';
import assert from 'assert';
import { Report } from '../inventory/Report';
import { AppMapConfig, ConfiguredPackage } from '../../lib/loadAppMapConfig';
import { Reporter, TemplateDirectory, AugmentedReportData } from './Reporter';
import { ReportTemplate } from '../../report/ReportTemplate';
import loadReportTemplate from '../../report/loadReportTemplate';
import urlHelpers from '../../report/urlHelpers';
import helpers from '../../report/helpers';

export default class WelcomeReporter implements Reporter {
  constructor(public appmapURL: string, public sourceURL?: string) {}

  async generateReport(reportData: Report, appmapConfig: AppMapConfig): Promise<string> {
    assert(TemplateDirectory);
    const templateText = await loadReportTemplate(
      join(TemplateDirectory, 'welcome', 'welcome.hbs')
    );
    const template = new ReportTemplate(templateText, {
      ...helpers,
      ...urlHelpers({ appmapURL: this.appmapURL, sourceURL: this.sourceURL }),
      ...WelcomeReporter.helpers(),
    });
    const data: AugmentedReportData = { ...reportData, appmapConfig };
    return template.generateMarkdown(data);
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
        return configuredPackages.find(
          (configuredPackage) =>
            configuredPackage.path &&
            normalizePackage(pkg).startsWith(normalizePackage(configuredPackage.path))
        );
      });
    };

    return {
      packages_matching_configuration,
      select_values_by_key_range,
      sum_values_by_key_range,
    };
  }
}
