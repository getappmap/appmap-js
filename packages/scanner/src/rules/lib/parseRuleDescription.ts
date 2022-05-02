import fs from 'fs';
import { join } from 'path';
import { dasherize } from './util';

export default function parseRuleDescription(id: string): string {
  const content = fs.readFileSync(
    join(__dirname, `../../../doc/rules/${dasherize(id)}.md`),
    'utf-8'
  );
  const propertiesContent = content.match(/---\n((?:.*\n)+)---\n((?:.*\n)+?)##?#?/);

  if (!propertiesContent) {
    // This is probably a new doc that doesn't have front matter yet.
    // It's all description.
    return content;
  }

  return propertiesContent[2].replace(/\n/g, ' ').trim();
}
