import { existsSync } from 'fs';
import Handlebars from 'handlebars';
import { isAbsolute, join, relative } from 'path';
import Report from './Report';
import { ChangeReport as ChangeReportData } from '../compare/ChangeReport';
import assert from 'assert';
import ChangeReport, { AppMap } from './ChangeReport';
import ReportSection from './ReportSection';
import { log } from 'console';
import { inspect } from 'util';
import { RevisionName } from '../compare/RevisionName';

// TODO: Restore these
// export const SECTIONS = ['failed-tests', 'openapi-diff', 'findings', 'new-appmaps'];
// export const EXPERIMENTAL_SECTIONS = ['changed-appmaps'];

export const SECTIONS = ['failed-tests', 'openapi-diff'];
export const EXPERIMENTAL_SECTIONS = [];

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
    const self = this;

    const headings = new Array<string>();
    const details = new Array<string>();
    for (const sectionName of sections) {
      const section = await ReportSection.build(sectionName);
      const heading = section.generateHeading(changeReport);
      const detail = section.generateDetails(changeReport, {
        sourceURL: this.sourceURL,
        appmapURL: this.appmapURL,
      });

      log(`${sectionName} heading: ${heading}`);
      log(`${sectionName} details: ${detail}`);

      headings.push(heading);
      details.push(detail);
    }

    return [...headings, ...details].join('\n');

    // const self = this;

    // Handlebars.registerHelper('appmap_diff_url', function (diagram): SafeString {
    //   if (diagram.startsWith('./')) diagram = diagram.slice('./'.length);
    //   if (diagram.startsWith('diff/')) diagram = diagram.slice('diff/'.length);
    //   if (diagram.endsWith('.diff.sequence.json'))
    //     diagram = diagram.slice(0, '.diff.sequence.json'.length * -1);
    //   const path = ['diff', `${diagram}.diff.sequence.json`].join('/');

    //   if (self.appmapURL) {
    //     const url = new URL(self.appmapURL.toString());
    //     url.searchParams.append('path', path);
    //     return new Handlebars.SafeString(url.toString());
    //   } else {
    //     return new Handlebars.SafeString(path);
    //   }
    // });

    // return Template(changeReport, { allowProtoPropertiesByDefault: true });
  }
}
