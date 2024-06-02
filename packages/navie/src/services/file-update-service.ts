import { readFile, writeFile } from 'fs/promises';
import assert from 'assert';

import InteractionHistory from '../interaction-history';

export type FileUpdate = {
  file: string;
  original: string;
  modified: string;
};

export default class FileUpdateService {
  constructor(public history: InteractionHistory) {}

  async apply(fileUpdate: FileUpdate): Promise<string[] | undefined> {
    this.history.log(`[file-update] Applying file change to ${fileUpdate.file}  `);
    this.history.log(`[file-update] Original content:\n${fileUpdate.original}`);
    this.history.log(`[file-update] Modified content:\n${fileUpdate.modified}`);

    const fileContents = await readFile(fileUpdate.file, 'utf8');
    const fileLines = fileContents.split('\n');

    const originalLines = fileUpdate.original.split('\n');
    const originalLineCount = originalLines.length;

    const adjustLine = (offset: number, line: string): string => {
      if (offset >= 0) return ' '.repeat(offset) + line;

      return line.substring(-offset);
    };

    let matchLine: number | undefined;
    let matchIndentOffset: number | undefined;
    // Ajust for LLM errors in indenting.
    const indentOffsetOptions = [0, -2, 2, -4, 4, -6, 6, -8, 8, -10, 10, -12, 12];
    for (const offset of indentOffsetOptions) {
      const adjust = (line: string) => adjustLine(offset, line);
      const originalContentWithIndent = originalLines.map(adjust).join('\n');
      const matchChar = fileContents.indexOf(originalContentWithIndent);
      if (matchChar !== -1) {
        matchLine = fileContents.substring(0, matchChar).split('\n').length - 1;
        matchIndentOffset = offset;
        break;
      }
    }

    if (matchLine === undefined || matchLine === -1) {
      this.history.log(`[file-update] Failed to find match for ${fileUpdate.file}`);
      return undefined;
    }

    this.history.log(
      `[file-update] Found match at line ${matchLine} with indent offset ${matchIndentOffset}`
    );

    // Assume that the LLM-generated replacement code has the same offset as the original code.
    const modifiedContent = fileUpdate.modified
      .split('\n')
      .map((line) => {
        assert(matchIndentOffset !== undefined);
        return adjustLine(matchIndentOffset, line);
      })
      .join('\n');

    this.history.log(
      `[file-update] Merging content into match segment which spans from ${matchLine} to ${
        matchLine + originalLineCount
      }:\n`
    );

    const newContent = [];
    if (matchLine > 0) newContent.push(fileLines.slice(0, matchLine).join('\n'));
    newContent.push(modifiedContent);
    if (matchLine + originalLineCount < fileLines.length)
      newContent.push(fileLines.slice(matchLine + originalLineCount).join('\n'));

    await writeFile(fileUpdate.file, newContent.join('\n'), 'utf8');

    return [`File change applied to ${fileUpdate.file}.\n`];
  }
}
