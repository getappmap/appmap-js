import Reporter from './Reporter';
import { ChangeReport as ChangeReportData } from '../compare/ChangeReport';
import ChangeReport from './ChangeReport';
import ReportSection, { ExperimentalSection, ReportOptions, Section } from './ReportSection';

// TODO: Get this from the type?
export const SECTIONS: Section[] = [
  Section.FailedTests,
  Section.OpenAPIDiff,
  Section.SecurityFlaws,
  Section.PerformanceProblems,
  Section.CodeAntiPatterns,
  Section.NewAppMaps,
  Section.RemovedAppMaps,
];
export const EXPERIMENTAL_SECTIONS: ExperimentalSection[] = [
  ExperimentalSection.ChangedAppMaps,
  ExperimentalSection.SQLDiff,
];

export default class ChangeReporter implements Reporter {
  public excludeSections: string[] | undefined;
  public includeSections: string[] | undefined;

  constructor(public appmapURL: string, public sourceURL?: string) {}

  async generateReport(changeReportData: ChangeReportData): Promise<string> {
    const sections = [
      ...SECTIONS.filter((section) => !this.excludeSections?.includes(section)),
      ...EXPERIMENTAL_SECTIONS.filter((section) => this.includeSections?.includes(section)),
    ];

    const changeReport = await ChangeReport.build(changeReportData);

    const headings = new Array<string>();
    const details = new Array<string>();
    const reportOptions: ReportOptions = {
      appmapURL: this.appmapURL,
      sourceURL: this.sourceURL,
    };
    for (const sectionName of sections) {
      const section = await ReportSection.build(sectionName);
      const heading = section.generateHeading(changeReport).trim();
      if (heading) {
        const detail = section.generateDetails(changeReport, reportOptions);
        headings.push(heading);
        details.push(detail);
      }
    }

    const heading = [
      '# AppMap runtime code review',
      '',
      '| Summary | Status |',
      '| --- | --- |',
      ...headings,
      '',
    ].join('\n');

    const warnings: string[] = [];
    if (changeReport.warnings.length > 0) {
      warnings.push('');
      warnings.push('**Warnings occurred during analysis:**');
      for (const warning of changeReport.warnings) {
        warnings.push('');
        warnings.push('```');
        warnings.push(`(${warning.field}) ${warning.message}`);
        warnings.push('```');
      }
      warnings.push('');
    }

    const comments: string[] = [];
    if (changeReport.testFailures.length > 0) {
      comments.push('');
      comments.push(
        `:warning: **Note** Because ${changeReport.testFailures.length} test${
          changeReport.testFailures.length > 1 ? 's' : ''
        } failed, AppMap is showing an abbreviated analysis to help you get them working. Once all tests are passing, all report sections will be available.`
      );
      comments.push('');
    }

    return [heading, ...warnings, ...comments, ...details].join('\n');
  }
}
