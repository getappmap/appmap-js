import assert from 'assert';
import { Report } from '../inventory/Report';
import { AppMapConfig, ConfiguredPackage } from '../../lib/loadAppMapConfig';
import { Reporter } from './Reporter';
import { AppMapInfo, WelcomeReport } from './WelcomeReport';
import { ReportTemplate } from '../../report/ReportTemplate';
import compileTemplate from '../../report/compileTemplate';
import urlHelpers from '../../report/urlHelpers';
import helpers from '../../report/helpers';
import readIndexFile from '../inventory/readIndexFile';
import welcomeTemplate from '../../../resources/inventory-report/welcome/welcome.hbs';

export default class WelcomeReporter implements Reporter {
  constructor(public appmapURL: string, public sourceURL?: string) {}

  async generateReport(reportData: Report, appmapConfig: AppMapConfig): Promise<string> {
    const templateText = compileTemplate(welcomeTemplate);
    const template = new ReportTemplate(templateText, {
      ...helpers,
      ...urlHelpers({ appmapURL: this.appmapURL, sourceURL: this.sourceURL }),
      ...WelcomeReporter.helpers(),
    });

    const largeAppMapsGreaterThan1MB = Object.entries(reportData.largeAppMaps)
      .filter((entry) => entry[1] > 1024 * 1024)
      .reduce((acc, entry) => ((acc[entry[0]] = entry[1]), acc), {});

    const largeAppMaps: Record<string, AppMapInfo> = {};
    for (const appmap of Object.keys(largeAppMapsGreaterThan1MB)) {
      const metadata = await readIndexFile(appmap, 'metadata.json');
      const name = metadata.name;
      const sourceLocation = metadata.source_location;
      largeAppMaps[appmap] = { name, sourceLocation, size: reportData.largeAppMaps[appmap] };
    }

    const frequentlyOccurringFunctionsMoreThan1000 = Object.entries(reportData.frequentFunctions)
      .filter((entry) => entry[1].count > 1000)
      .reduce((acc, entry) => ((acc[entry[0]] = entry[1]), acc), {});

    const data: WelcomeReport = {
      ...reportData,
      ...{ largeAppMaps, frequentFunctions: frequentlyOccurringFunctionsMoreThan1000 },
      appmapConfig,
    };
    return template.generateMarkdown(data);
  }

  static helpers() {
    const agent_reference_name = (language: string) => {
      if (language === 'javascript') return 'agent-js';
      else return language;
    };

    const format_mb = (sizeInBytes: number) => {
      const sizeInMB = Math.round((sizeInBytes / 1024 / 1024) * 100) / 100;
      return `${sizeInMB} MB`;
    };

    const function_name = (functionId: string) => {
      // Example: function:ruby/Array#pack

      if (!functionId.startsWith('function:')) return functionId;

      const parts = functionId.split('/');
      return parts[parts.length - 1];
    };

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
      agent_reference_name,
      format_mb,
      function_name,
      packages_matching_configuration,
      select_values_by_key_range,
      sum_values_by_key_range,
    };
  }
}
