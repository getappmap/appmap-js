import { verbose } from '../../utils';
import { readFile, writeFile } from 'fs/promises';
import { warn } from 'console';
import assert from 'assert';

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
  } else if (fromWhitespace.endsWith(toWhitespace)) {
    const extra = fromWhitespace.length - toWhitespace.length;
    const adjuster = (s: string) => s.slice(extra);
    adjuster.desc = `-${extra}`;
    return adjuster;
  } else if (toWhitespace.endsWith(fromWhitespace)) {
    const extra = fromWhitespace ? toWhitespace.slice(0, -fromWhitespace.length) : toWhitespace;
    const adjuster = (s: string) => extra + s;
    adjuster.desc = `+${extra.length}`;
    return adjuster;
  }

  const fromRe = new RegExp(`^${fromWhitespace}`);
  const adjuster = (s: string) => s.replace(fromRe, toWhitespace);
  adjuster.desc = `${fromWhitespace.length} -> ${toWhitespace.length}`;
  return adjuster;
}

export default async function applyFileUpdate(
  file: string,
  original: string,
  modified: string
): Promise<string[] | undefined> {
  // Read the original file
  const fileContents = await readFile(file, 'utf-8');
  const fileLines = fileContents.split('\n');

  const originalLines = original.split('\n');
  const match = findLineMatch(fileLines, originalLines);
  if (!match) return [`[file-update] Failed to find match for ${file}.\n`];

  const [index, length] = match;

  const firstAdjuster = makeWhitespaceAdjuster(fileLines[index], originalLines[0]);
  const nonEmptyIndex = findNonEmpty(originalLines, 1);
  const adjustWhitespace = makeWhitespaceAdjuster(
    fileLines[index + nonEmptyIndex],
    originalLines[nonEmptyIndex]
  );

  if (verbose())
    warn(
      `[file-update] Found match at line ${index + 1}, whitespace adjustment: ${
        adjustWhitespace.desc
      }, first: ${firstAdjuster.desc}\n`
    );
  const [first, ...rest] = modified.split('\n');
  fileLines.splice(index, length, firstAdjuster(first), ...rest.map(adjustWhitespace));

  await writeFile(file, fileLines.join('\n'), 'utf8');
}

function findNonEmpty(lines: string[], start: number): number {
  for (let i = start; i < lines.length; ++i) if (lines[i].trim()) return i;
  return 0;
}
