import Handlebars, { SafeString } from 'handlebars';
import { isAbsolute, join, relative } from 'path';

import { readFile } from 'fs/promises';
import ChangeReport, { AppMap } from './ChangeReport';
import { existsSync } from 'fs';
import assert from 'assert';
import { RevisionName } from '../compare/RevisionName';

const TemplateDirectory = [
  '../../../resources/change-report', // As packaged
  '../../../../resources/change-report', // In development
]
  .map((dirName) => join(__dirname, dirName))
  .find((dirName) => existsSync(dirName));
assert(TemplateDirectory, "Report template directory 'change-report' not found");

export type ReportOptions = {
  sourceURL: URL;
  appmapURL: URL;
};

export default class ReportSection {
  constructor(
    public section: string,
    private headingTemplate: HandlebarsTemplateDelegate,
    private detailsTemplate: HandlebarsTemplateDelegate
  ) {}

  generateHeading(changeReport: ChangeReport, options: ReportOptions) {
    return this.headingTemplate(changeReport, {
      helpers: ReportSection.helpers(options),
      allowProtoPropertiesByDefault: true,
    });
  }

  generateDetails(changeReport: ChangeReport, options: ReportOptions) {
    return this.detailsTemplate(changeReport, {
      helpers: ReportSection.helpers(options),
      allowProtoPropertiesByDefault: true,
    });
  }

  static helpers(options: ReportOptions): { [name: string]: Function } | undefined {
    const inspect = (value: any) => {
      return new Handlebars.SafeString(JSON.stringify(value, null, 2));
    };

    const length = (...list: any[]): number => {
      const _fn = list.pop();
      let result = 0;
      for (const item of list) {
        if (Array.isArray(item)) {
          result += item.length;
        }
      }
      return result;
    };

    const coalesce = (...list: any[]): number => {
      const _fn = list.pop();
      return list.find((item) => item !== undefined && item !== '');
    };

    const source_url = (location: string, fileLinenoSeparator = '#L') => {
      if (typeof fileLinenoSeparator === 'object') {
        fileLinenoSeparator = '#L';
      }

      const [path, lineno] = location.split(':');

      if (isAbsolute(path)) return;
      if (path.startsWith('vendor/') || path.startsWith('node_modules/')) return;

      if (options.sourceURL) {
        const url = new URL(options.sourceURL.toString());
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
    };

    const appmap_url = (revisionName: RevisionName, appmap: AppMap) => {
      let { id } = appmap;
      const path = [revisionName, `${id}.appmap.json`].join('/');

      if (options.appmapURL) {
        const url = new URL(options.appmapURL.toString());
        url.searchParams.append('path', path);
        return new Handlebars.SafeString(url.toString());
      } else {
        return new Handlebars.SafeString(path);
      }
    };

    const appmap_diff_url = (appmap: AppMap): SafeString => {
      const path = ['diff', `${appmap.id}.diff.sequence.json`].join('/');

      if (options.appmapURL) {
        const url = new URL(options.appmapURL.toString());
        url.searchParams.append('path', path);
        return new Handlebars.SafeString(url.toString());
      } else {
        return new Handlebars.SafeString(path);
      }
    };

    return {
      inspect,
      length,
      coalesce,
      appmap_url,
      appmap_diff_url,
      source_url,
    };
  }

  static async build(section: string, templateDir = TemplateDirectory): Promise<ReportSection> {
    assert(templateDir);
    const headingTemplateFile = join(templateDir, section, 'heading.hbs');
    const headingTemplate = Handlebars.compile(await readFile(headingTemplateFile, 'utf8'));

    const detailsTemplateFile = join(templateDir, section, 'details.hbs');
    const detailsTemplate = Handlebars.compile(await readFile(detailsTemplateFile, 'utf8'));

    return new ReportSection(section, headingTemplate, detailsTemplate);
  }
}
