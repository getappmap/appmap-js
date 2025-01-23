import queryKeywords from './query-keywords';
import makeDebug from 'debug';

const debug = makeDebug('appmap:search:tokenize');

export const SymbolRegexes: Record<string, RegExp> = {
  cs: /(((interface|class|enum|struct)\s+(?<symbol1>\w+))|((\s|^)(?!using|try|catch|if|while|do|for|switch)(?<!#define\s+?)(?<symbol2>[\w~$]+)\s*?\([^;)]*?\)[\w\s\d<>[\].:\n]*?{))/g,
  cpp: /(((struct|enum|union|class)\s+(?<symbol1>\w+)\s*?\{)|(}\s*?(?<symbol2>\w+)\s*?;)|((\s|^)(?!try|catch|if|while|do|for|switch)(?<!#define\s+?)(?<symbol3>[\w~$]+)\s*?\([^;)]*?\)[\w\s\d<>[\].:\n]*?{))/g,
  rs: /(struct|enum|union|trait|type|fn)\s+(?<symbol1>[\w\p{L}]+)/gu,
  go: /((type\s+(?<symbol1>[\w\p{L}]+))|(func\s+?(\(.*?\)\s*?)?(?<symbol2>[\w\p{L}]+)\s*?\())/gu,
  rb: /(((class|module)\s+(?<symbol1>\w+))|(def\s+?(?<symbol2>\w+)))/g,
  py: /(class|def)\s+(?<symbol1>\w+)/g,
  java: /(((class|@?interface|enum)\s+(?<symbol1>[\w$]+))|((\s|^)(?!try|catch|if|while|do|for|switch)(?<symbol2>[\w$]+)\s*?\([^;)]*?\)[\w\s\d<>[\].:\n]*?{))/g,
  ts: /(((class|interface|enum|type|function)\s+(?<symbol1>[#$\w\p{L}]+))|((\s|^)(?!using|try|catch|if|while|do|for|switch)(?<symbol2>[#$\w\p{L}]+)\s*?\([^;)]*?\)[\w\s<>[\].:\n]*?\{)|((?<symbol3>[#$\w\p{L}]+)\s*?(=|:)\s*?\(.*?\)\s*?=>))/gu,
  kt: /(((class|typealias)\s+(?<symbol1>[\w_]+))|(fun\s+?(<.+?>\s+)?(.*?\.)?(?<symbol2>\w+)))/g,
  php: /(class|trait|function)\s+(?<symbol1>[\w_$]+)/g,
};

const genericSymbolRegex =
  /(((^|\s)(?!using|try|catch|if|while|do|for|switch)(?<symbol1>[#$\w\p{L}~]+)\s*?\(([^;)])*?\)[\w\s<>[\].:\n]*?\{)|(^(?!.*?(?:#|\/\/|"|')).*?(interface|class|enum|struct|union|trait|type(alias|def)?|fu?nc?(tion)?|module|def)\s+?(?<symbol2>[#$\w\p{L}]+))|((?<symbol3>[#$\w\p{L}~]+)\s*?=\s*?[\w\s<>[\].:\n]*?\{))/gmu;

// Define aliases for common file extensions
['js', 'jsx', 'ts', 'tsx', 'vue', 'svelte'].forEach((ext) => {
  SymbolRegexes[ext] = SymbolRegexes.ts;
});

['c', 'cc', 'cxx', 'h', 'hpp', 'cpp', 'hxx'].forEach((ext) => {
  SymbolRegexes[ext] = SymbolRegexes.cpp;
});

function getMatches(source: string, regex: RegExp): string[] {
  const results: string[] = [];
  const matches = source.matchAll(regex);

  for (const match of matches) {
    const { groups } = match;
    const symbol = groups?.symbol1 ?? groups?.symbol2 ?? groups?.symbol3;

    if (symbol) results.push(symbol);
  }

  return results;
}

export function symbols(content: string, fileExtension: string, allowGeneric = true): string[] {
  let regex = allowGeneric ? genericSymbolRegex : undefined;
  if (fileExtension && fileExtension in SymbolRegexes) {
    regex = SymbolRegexes[fileExtension];
  }

  if (regex) {
    return getMatches(content, regex);
  }

  return [];
}

export function words(content: string): string[] {
  return content.match(/\b\w+\b/g) ?? [];
}

/**
 * Prepares a string for tokenization by splitting it into batches of lines, each of which is
 * no longer than the specified maximum length.
 *
 * @param content The content to split into batches
 * @param batchSize The maximum number of characters per batch
 * @param maxLineLength The maximum length of a line
 * @returns an array of batches of content
 */
export function batch(content: string, batchSize = 1000, maxLineLength = 1000): string[] {
  const lines = content.split('\n').filter(({ length }) => length <= maxLineLength);
  const result = [];
  for (let i = 0; i < lines.length; i += batchSize) {
    result.push(lines.slice(i, i + batchSize).join('\n'));
  }

  return result;
}

type FileTokens = {
  symbols: string[];
  words: string[];
};

export async function fileTokens(
  content: string,
  fileExtension: string,
  enableGenericSymbolParsing = true
): Promise<FileTokens> {
  if (enableGenericSymbolParsing)
    debug('Using generic symbol parsing for file extension: %s', fileExtension);

  const batches = batch(content);
  const symbolList: string[] = [];
  const wordList: string[] = [];

  for (let i = 0; i < batches.length; ++i) {
    if (i && i % 5 === 0) {
      // Every 5th batch, wait for the next tick to avoid blocking the event loop
      await new Promise((resolve) => setImmediate(resolve));
    }

    const batch = batches[i];
    symbolList.push(...queryKeywords(symbols(batch, fileExtension, enableGenericSymbolParsing)));
    wordList.push(...queryKeywords(words(batch)));
  }

  symbolList.sort();
  wordList.sort();

  // Iterate through words, with a corresponding pointer to symbols.
  // If the word at the word index does not match the symbol at the symbol index,
  // add the word to the output. Otherwise, advance both pointers. Repeat
  // until all words have been traversed.
  const filteredWordList = new Array<string>();
  let symbolIndex = 0;
  let wordIndex = 0;
  const collectWord = () => {
    const word = wordList[wordIndex];
    const symbol = symbolList[symbolIndex];
    if (word === symbol) {
      symbolIndex += 1;
    } else {
      filteredWordList.push(word);
    }
    wordIndex += 1;
  };

  while (wordIndex < wordList.length) collectWord();

  return {
    symbols: symbolList,
    words: filteredWordList,
  };
}
