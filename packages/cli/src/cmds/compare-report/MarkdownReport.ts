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

const TemplateDirectory = [
  '../../../resources/change-report', // As packaged
  '../../../../resources/change-report', // In development
]
  .map((dirName) => join(__dirname, dirName))
  .find((dirName) => existsSync(dirName));
assert(TemplateDirectory, "Report template directory 'change-report' not found");

// TODO: Restore these
// export const SECTIONS = ['failed-tests', 'openapi-diff', 'findings', 'new-appmaps'];
// export const EXPERIMENTAL_SECTIONS = ['changed-appmaps'];

export const SECTIONS = ['failed-tests', 'openapi-diff'];
export const EXPERIMENTAL_SECTIONS = [];

export default class MarkdownReport implements Report {
  public excludeSections: string[] | undefined;
  public includeSections: string[] | undefined;

  constructor(public appmapURL: URL, public sourceURL: URL) {}

  async generateReport(changeReportData: ChangeReportData, baseDir: string): Promise<string> {
    const sections = [
      ...SECTIONS.filter((section) => !this.excludeSections?.includes(section)),
      ...EXPERIMENTAL_SECTIONS.filter((section) => this.includeSections?.includes(section)),
    ];

    const changeReport = await ChangeReport.build(changeReportData);
    const self = this;

    Handlebars.registerHelper('inspect', function (value: any) {
      return new Handlebars.SafeString(JSON.stringify(value, null, 2));
    });

    Handlebars.registerHelper('length', function (...list): number {
      const _fn = list.pop();
      let result = 0;
      for (const item of list) {
        if (Array.isArray(item)) {
          result += item.length;
        }
      }
      return result;
    });

    Handlebars.registerHelper('coalesce', function (...list): number {
      const _fn = list.pop();
      return list.find((item) => item !== undefined && item !== '');
    });

    Handlebars.registerHelper('source_url', function (location, fileLinenoSeparator = '#L') {
      if (typeof fileLinenoSeparator === 'object') {
        fileLinenoSeparator = '#L';
      }

      const [path, lineno] = location.split(':');

      if (isAbsolute(path)) return;
      if (path.startsWith('vendor/') || path.startsWith('node_modules/')) return;

      if (self.sourceURL) {
        const url = new URL(self.sourceURL.toString());
        if (url.protocol === 'file:') {
          const sourcePath = relative(process.cwd(), join(url.pathname, path));
          return new Handlebars.SafeString(
            [sourcePath, lineno].filter(Boolean).join(fileLinenoSeparator)
          );
        } else {
          url.pathname = join(url.pathname, path);
          if (lineno) url.hash = `L${lineno}`;
          return new Handlebars.SafeString(url.toString());
        }
      } else {
        return new Handlebars.SafeString(location);
      }
    });

    Handlebars.registerHelper('appmap_url', function (revisionName: RevisionName, appmap: AppMap) {
      let { fileName } = appmap;
      if (fileName.startsWith('./')) fileName = fileName.slice('./'.length);
      if (fileName.endsWith('.appmap.json'))
        fileName = fileName.slice(0, '.appmap.json'.length * -1);
      const path = [revisionName, `${fileName}.appmap.json`].join('/');

      if (self.appmapURL) {
        const url = new URL(self.appmapURL.toString());
        url.searchParams.append('path', path);
        return new Handlebars.SafeString(url.toString());
      } else {
        return new Handlebars.SafeString(path);
      }
    });

    log(inspect(changeReport));

    const headings = new Array<string>();
    const details = new Array<string>();
    for (const sectionName of sections) {
      assert(TemplateDirectory);
      const section = await ReportSection.build(sectionName, TemplateDirectory);
      const heading = section.generateHeading(changeReport);
      const detail = section.generateDetails(changeReport);

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
