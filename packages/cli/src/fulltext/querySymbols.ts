import { readFileSync } from 'fs';
import { sanitizeKeyword, STOP_WORDS } from './queryKeywords';
import { splitCamelized } from '../lib/splitCamelized';

export const SymbolRegexes: Record<string, RegExp> = {
  cs: /(((interface|class|enum|struct)\s+(?<symbol1>\w+))|((\s|^)(?!using|try|catch|if|while|do|for|switch)(?<!#define\s+?)(?<symbol2>[\w~$]+)\s*?\([^;)]*?\)[\w\s\d<>[\].:\n]*?{))/g,
  cpp: /(((struct|enum|union|class)\s+(?<symbol1>\w+)\s*?\{)|(}\s*?(?<symbol2>\w+)\s*?;)|((\s|^)(?!try|catch|if|while|do|for|switch)(?<!#define\s+?)(?<symbol3>[\w~$]+)\s*?\([^;)]*?\)[\w\s\d<>[\].:\n]*?{))/g,
  rs: /(struct|enum|union|trait|type|fn)\s+(?<symbol1>[\w\p{L}]+)/gu,
  go: /((type\s+(?<symbol1>[\w\p{L}]+))|(func\s+?(\(.*?\)\s*?)?(?<symbol2>[\w\p{L}]+)\s*?\())/gu,
  rb: /(((class|module)\s+(?<symbol1>\w+))|(def\s+?(?<symbol2>\w+)))/g,
  py: /(?:([\d]+?|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|f|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|self|super|True|try|while|with|yield)[\s."'=,())\]:])|(?<symbol1>[^\s=():,*+-.`[\]>{}"'#/!]{3,})/g,
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

function expandSymbol(symbol: string): string[] {
  const results = sanitizeKeyword(symbol)
    .flatMap((t) =>
      splitCamelized(t)
        .split(/[\s-_]/)
        .map((s) => s.toLowerCase())
    )
    .filter((t) => t.trim().length > 1);
  const unique = new Set([...results, symbol.toLowerCase()]);
  return Array.from(unique).filter((t) => !STOP_WORDS.has(t));
}

function getMatches(source: string, regex: RegExp): string[] {
  const results: string[] = [];
  const matches = source.matchAll(regex);

  for (const match of matches) {
    const { groups } = match;
    const symbol = groups?.symbol1 ?? groups?.symbol2 ?? groups?.symbol3;

    if (symbol) results.push(...expandSymbol(symbol));
  }

  return results;
}

export default function querySymbols(path: string, allowGeneric = true): string[] {
  const fileExtension = path.split('.').pop()?.toLowerCase();

  let regex = allowGeneric ? genericSymbolRegex : undefined;
  if (fileExtension && fileExtension in SymbolRegexes) {
    regex = SymbolRegexes[fileExtension];
  }

  if (regex) {
    try {
      // readFileSync performs 2x faster than its async counterpart in this case.
      const content = readFileSync(path, 'utf-8');
      return getMatches(content, regex);
    } catch (error) {
      console.warn(`Error reading file ${path}`);
      console.warn(error);
    }
  }

  return [];
}
