import XML from 'fast-xml-parser';

import { FileUpdate } from '../file-update';
import { Update } from '../services/compute-update-service';

export default function extractFileChanges(content: string): (Update & { file?: string })[] {
  // Search for <change> tags
  const changeRegex = /<change>([\s\S]*?)<\/change>/gi;
  let match: RegExpExecArray | null;
  const changes = new Array<FileUpdate>();

  // Trim at most one leading and trailing blank lines
  const trimChange = (change: string): string => change.replace(/^\s*\n/, '').replace(/\n\s*$/, '');

  // eslint-disable-next-line no-cond-assign
  while ((match = changeRegex.exec(content)) !== null) {
    const change = match[1];

    const parser = new XML.XMLParser();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const jObj = parser.parse(change);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (jObj && jObj.original && jObj.modified) {
      const update = jObj as FileUpdate;
      update.original = trimChange(update.original);
      update.modified = trimChange(update.modified);
      changes.push(jObj as FileUpdate);
    }
  }
  return changes;
}
