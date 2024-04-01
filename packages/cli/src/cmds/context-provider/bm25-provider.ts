import { readFile } from 'fs/promises';
import { SourceIndex, unpackRef } from '../../fulltext/SourceIndex';
import { ContextResult, ContextValue } from './context-provider';

let INDEX: lunr.Index | null = null;

let indexBuildingPromise: Promise<lunr.Index> | null = null;

async function buildIndex(): Promise<lunr.Index> {
  const sourceIndex = new SourceIndex();
  return await sourceIndex.execute();
}

async function findOrCreateIndex(): Promise<lunr.Index> {
  if (INDEX) return INDEX;

  if (indexBuildingPromise) return await indexBuildingPromise;

  indexBuildingPromise = buildIndex().then((index) => {
    INDEX = index;
    indexBuildingPromise = null;
    return index;
  });
  return await indexBuildingPromise;
}

export default async function bm25Provider(
  keywords: string[],
  charLimit: number
): Promise<ContextResult> {
  const index = await findOrCreateIndex();
  const searchResults = index.search(keywords.join(' '));

  const result = new Array<ContextValue>();
  let charCount = 0;
  for (const searchResult of searchResults) {
    const { fileName, from, to } = unpackRef(searchResult.ref);
    let content: string | undefined;
    try {
      content = await readFile(fileName, 'utf-8');
    } catch (e) {
      console.error(`Error reading file ${fileName}`);
      console.error(e);
      continue;
    }

    const lines = content.split('\n').slice(from, to);
    const type = 'codeSnippet';
    const { score } = searchResult;
    result.push({ id: searchResult.ref, type, content: lines.join('\n'), score });
    charCount += lines.join('\n').length;
    if (charCount > charLimit) break;
  }
  return result;
}
