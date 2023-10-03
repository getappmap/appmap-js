import Handlebars from 'handlebars';
import { Report } from '../inventory/Report';
import { join } from 'path';
import { readFile } from 'fs/promises';
import assert from 'assert';
import { existsSync } from 'fs';
import { warn } from 'console';

export const TemplateDirectory = [
  '../../../resources/inventory-report', // As packaged
  '../../../../resources/inventory-report', // In development
]
  .map((dirName) => join(__dirname, dirName))
  .find((dirName) => existsSync(dirName));
assert(TemplateDirectory, "Report template directory 'inventory-report' not found");

class ReportTemplate {
  constructor(public template: HandlebarsTemplateDelegate) {}

  generateMarkdown(report: Report): string {
    return this.template(report, {
      helpers: ReportTemplate.helpers(),
      allowProtoPropertiesByDefault: true,
    });
  }

  static helpers(): { [name: string]: Function } | undefined {
    const inspect = (value: any) => {
      return new Handlebars.SafeString(JSON.stringify(value, null, 2));
    };

    const length = (...list: any[]): number => {
      const _fn = list.pop();
      let result = 0;
      for (const item of list) {
        if (Array.isArray(item)) {
          result += item.length;
        } else if (item.constructor === Map) {
          result += item.size;
        } else if (typeof item === 'object') {
          result += Object.keys(item).length;
        }
      }
      return result;
    };

    const coalesce = (...list: any[]): number => {
      const _fn = list.pop();
      return list.find((item) => item !== undefined && item !== '');
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
    const extractArrayValue = (args: any[]): any[] => (Array.isArray(args[0]) ? args[0] : args);

    const sum_values_by_key_range = (
      data: Record<number, number>,
      keyMin: number,
      keyMax?: number
    ): number => {
      const values = select_values_by_key_range(data, keyMin, keyMax);
      return values.reduce((a, b) => a + (b || 0), 0);
    };

    const sum = () => {
      const args = [...arguments];
      const _fn = args.pop();
      const values = extractArrayValue(args);
      return values.reduce((a, b) => a + (b || 0), 0);
    };

    return {
      coalesce,
      inspect,
      length,
      select_values_by_key_range,
      sum,
      sum_values_by_key_range,
    };
  }

  static async build(templateDir = TemplateDirectory): Promise<ReportTemplate> {
    assert(templateDir);
    const headingTemplateFile = join(templateDir, 'inventory.hbs');
    const template = Handlebars.compile(await readFile(headingTemplateFile, 'utf8'));

    return new ReportTemplate(template);
  }
}

export default class MarkdownReport {
  constructor() {}

  async generateReport(reportData: Report): Promise<string> {
    const template = await ReportTemplate.build();
    return template.generateMarkdown(reportData);
  }
}
