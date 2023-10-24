import assert from 'assert';
import { existsSync } from 'fs';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import Handlebars from 'handlebars';

export const TemplateInlinesDirectory = [
  '../../resources/inlines', // As packaged
  '../../../resources/inlines', // In development
]
  .map((dirName) => join(__dirname, dirName))
  .find((dirName) => existsSync(dirName));

assert(TemplateInlinesDirectory, "Report template directory 'inlines' not found");

export default async function loadReportTemplate(
  templateFile: string
): Promise<HandlebarsTemplateDelegate> {
  assert(TemplateInlinesDirectory);
  const inlineFiles = await readdir(TemplateInlinesDirectory);
  const inlines = new Array<string>();
  for (const inlineFile of inlineFiles) {
    const inline = await readFile(join(TemplateInlinesDirectory, inlineFile), 'utf8');
    inlines.push(inline);
  }
  const mainTemplate = await readFile(templateFile, 'utf8');
  return Handlebars.compile([...inlines, mainTemplate].join('\n'));
}
