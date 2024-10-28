import { readFile, writeFile } from 'fs/promises';
import assert from 'assert';
import makeDebug from 'debug';

const debug = makeDebug('appmap:cli:file-update');

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

type MatchResult = {
  index: number;
  length: number;
  whitespaceAdjuster: (s: string) => string;
  whitespaceAdjusterDescription: string;
};

function matchFileUpdate(fileLines: string[], originalLines: string[]): MatchResult | undefined {
  const match = findLineMatch(fileLines, originalLines);
  if (!match) return undefined;

  const [index, length] = match;
  const nonEmptyIndex = originalLines.findIndex((s) => s.trim());
  const adjustWhitespace = makeWhitespaceAdjuster(
    fileLines[index + nonEmptyIndex],
    originalLines[nonEmptyIndex]
  );

  return {
    index,
    length,
    whitespaceAdjuster: adjustWhitespace,
    whitespaceAdjusterDescription: adjustWhitespace.desc,
  };
}

function searchForFileUpdate(
  whitespaceAdjustments: string[],
  fileLines: string[],
  originalLines: string[]
): [MatchResult, string] | undefined {
  for (const whitespaceAdjustment of whitespaceAdjustments) {
    const adjustedOriginalLines = [...originalLines];
    adjustedOriginalLines[0] = whitespaceAdjustment + adjustedOriginalLines[0];
    const match = matchFileUpdate(fileLines, adjustedOriginalLines);
    if (match) return [match, whitespaceAdjustment];
  }

  return undefined;
}

export default async function applyFileUpdate(
  file: string,
  original: string,
  modified: string
): Promise<string[] | undefined> {
  const fileContents = await readFile(file, 'utf-8');
  const fileLines = fileContents.split('\n');
  const originalLines = original.split('\n');

  if (fileLines.length === 0) {
    debug(`File is empty. Skipping.`);
    return undefined;
  }
  if (originalLines.length === 0) {
    debug(`Original text is empty. Skipping.`);
    return undefined;
  }

  const firstLineLeadingWhitespace = originalLines[0].match(/^\s*/)?.[0];
  let whitespaceAdjustments: Set<string>;

  if (!firstLineLeadingWhitespace) {
    debug(
      `No leading whitespace found in the first line of the original text. Will attempt a fuzzy match.`
    );
    const fileLinesMatchingFirstOriginalLine = new Set(
      fileLines.filter((line) => line.includes(originalLines[0]))
    );
    whitespaceAdjustments = new Set(
      Array.from(fileLinesMatchingFirstOriginalLine).map((line) => line.match(/^\s*/)?.[0] ?? '')
    );
  } else {
    whitespaceAdjustments = new Set(['']);
  }

  const searchResult = searchForFileUpdate(
    Array.from(whitespaceAdjustments),
    fileLines,
    originalLines
  );
  if (!searchResult) {
    debug(`No match found for the original text.`);
    return undefined;
  }

  const [match, leadingWhitespace] = searchResult;
  const adjustedModified = [...modified.split('\n')];
  adjustedModified[0] = leadingWhitespace + adjustedModified[0];

  debug(
    `[file-update] Found match at line ${match.index + 1}, whitespace adjustment: ${
      match.whitespaceAdjusterDescription
    }\n`
  );
  fileLines.splice(match.index, match.length, ...adjustedModified.map(match.whitespaceAdjuster));

  await writeFile(file, fileLines.join('\n'), 'utf8');
}
