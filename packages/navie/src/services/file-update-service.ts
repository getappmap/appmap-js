import { readFile, writeFile } from 'fs/promises';
import assert from 'assert';
import { existsSync } from 'fs';

import InteractionHistory from '../interaction-history';

export type FileUpdate = {
  file: string;
  original: string;
  modified: string;
};

function findLineMatch(
  haystack: readonly string[],
  needle: readonly string[]
): [number, number] | undefined {
  const trimmed = needle.map((s) => s.trim()).filter((s) => s); // skip blank lines
  assert(trimmed.length && haystack.length);

  let needlePos = 0;
  let start = 0;
  for (let i = 0; i < haystack.length; i += 1) {
    const hay = haystack[i].trim();
    // skip blank lines
    if (hay) {
      if (trimmed[needlePos] !== hay) needlePos = 0;
      if (trimmed[needlePos] === hay) {
        if (!needlePos) start = i;
        needlePos += 1;
        if (needlePos === trimmed.length) return [start, i - start + 1];
      }
    }
  }

  return undefined;
}

function makeWhitespaceAdjuster(to: string, from: string) {
  const fromWhitespace = from.match(/^\s*/)?.[0];
  const toWhitespace = to.match(/^\s*/)?.[0];

  assert(fromWhitespace !== undefined);
  assert(toWhitespace !== undefined);

  if (fromWhitespace === toWhitespace) {
    const adjuster = (s: string) => s;
    adjuster.desc = 'none';
    return adjuster;
  }

  const fromRe = new RegExp(`^${fromWhitespace}`);
  const adjuster = (s: string) => s.replace(fromRe, toWhitespace);
  adjuster.desc = `${fromWhitespace.length} -> ${toWhitespace.length}`;
  return adjuster;
}

export default class FileUpdateService {
  constructor(public history: InteractionHistory) {}

  async apply(fileUpdate: FileUpdate): Promise<string[] | undefined> {
    this.history.log(`[file-update] Applying file change to ${fileUpdate.file}  `);
    this.history.log(`[file-update] Original content:\n${fileUpdate.original}`);
    this.history.log(`[file-update] Modified content:\n${fileUpdate.modified}`);

    if (!existsSync(fileUpdate.file)) {
      this.history.log(`[file-update] File does not exist: ${fileUpdate.file}`);

      await writeFile(fileUpdate.file, fileUpdate.modified, 'utf8');

      return undefined;
    }

    const fileContents = await readFile(fileUpdate.file, 'utf8');
    const fileLines = fileContents.split('\n');

    const originalLines = fileUpdate.original.split('\n');

    const match = findLineMatch(fileLines, originalLines);
    if (!match) return [`[file-update] Failed to find match for ${fileUpdate.file}.\n`];

    const [index, length] = match;

    const nonEmptyIndex = originalLines.findIndex((s) => s.trim());
    const adjustWhitespace = makeWhitespaceAdjuster(
      fileLines[index + nonEmptyIndex],
      originalLines[nonEmptyIndex]
    );

    this.history.log(
      `[file-update] Found match at line ${index + 1}, whitespace adjustment: ${
        adjustWhitespace.desc
      }\n`
    );
    fileLines.splice(index, length, ...fileUpdate.modified.split('\n').map(adjustWhitespace));

    await writeFile(fileUpdate.file, fileLines.join('\n'), 'utf8');

    return [`File change applied to ${fileUpdate.file}.\n`];
  }
}
