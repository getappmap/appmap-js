import fs from 'fs';
import { ValidationError } from '../../errors';

export default function parseRuleDescription(id: string): string {
  const content = fs.readFileSync(`doc/rules/${id}.md`, 'utf-8');
  const propertiesContent = content.match(/---\n((?:.*\n)+)---\n((?:.*\n)+?)###/);

  if (!propertiesContent) {
    throw new ValidationError(`Unable to read description for rule "${id}".`);
  }

  return propertiesContent[2].replace(/\n/g, ' ').trim();
}
