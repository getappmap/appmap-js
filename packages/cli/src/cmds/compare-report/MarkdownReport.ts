import Report from './Report';
import { ChangeReport as ChangeReportData } from '../compare/ChangeReport';
import ChangeReport from './ChangeReport';
import ReportSection, { ExperimentalSection, ReportOptions, Section } from './ReportSection';
import { log } from 'console';

// TODO: Get this from the type?
export const SECTIONS: Section[] = [
  Section.FailedTests,
  Section.OpenAPIDiff,
  Section.Findings,
  Section.NewAppMaps,
  Section.RemovedAppMaps,
];
export const EXPERIMENTAL_SECTIONS: ExperimentalSection[] = [ExperimentalSection.ChangedAppMaps];

export default class MarkdownReport implements Report {
  public excludeSections: string[] | undefined;
  public includeSections: string[] | undefined;

  constructor(public appmapURL: URL, public sourceURL: URL) {}

  async generateReport(changeReportData: ChangeReportData): Promise<string> {
    const sections = [
      ...SECTIONS.filter((section) => !this.excludeSections?.includes(section)),
      ...EXPERIMENTAL_SECTIONS.filter((section) => this.includeSections?.includes(section)),
    ];

    const changeReport = await ChangeReport.build(changeReportData);

    const headings = new Array<string>();
    const details = new Array<string>();
    const reportOptions: ReportOptions = {
      sourceURL: this.sourceURL,
      appmapURL: this.appmapURL,
    };
    for (const sectionName of sections) {
      const section = await ReportSection.build(sectionName);
      const heading = section.generateHeading(changeReport, reportOptions).trim();
      if (heading) {
        const detail = section.generateDetails(changeReport, reportOptions);
        headings.push(heading);
        details.push(detail);
      }
    }

    const heading = ['# AppMap', '', '| Summary | Status |', '| --- | --- |', ...headings, ''].join(
      '\n'
    );
    return [heading, ...details].join('\n');
  }
}
