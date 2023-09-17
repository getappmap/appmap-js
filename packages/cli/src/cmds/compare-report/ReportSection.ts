import Handlebars from 'handlebars';
import { join } from 'path';

import { readFile } from 'fs/promises';
import ChangeReport from './ChangeReport';

export default class ReportSection {
  constructor(
    public section: string,
    private headingTemplate: HandlebarsTemplateDelegate,
    private detailsTemplate: HandlebarsTemplateDelegate
  ) {}

  generateHeading(changeReport: ChangeReport) {
    return this.headingTemplate(changeReport, { allowProtoPropertiesByDefault: true });
  }

  generateDetails(changeReport: ChangeReport) {
    return this.detailsTemplate(changeReport, { allowProtoPropertiesByDefault: true });
  }

  static async build(section: string, templateDir: string): Promise<ReportSection> {
    const headingTemplateFile = join(templateDir, section, 'heading.hbs');
    const headingTemplate = Handlebars.compile(await readFile(headingTemplateFile, 'utf8'));

    const detailsTemplateFile = join(templateDir, section, 'details.hbs');
    const detailsTemplate = Handlebars.compile(await readFile(detailsTemplateFile, 'utf8'));

    return new ReportSection(section, headingTemplate, detailsTemplate);
  }
}
