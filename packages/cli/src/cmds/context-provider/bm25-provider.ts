import { readFile } from 'fs/promises';
import sqlite3 from 'sqlite3';

import { SourceIndexSQLite as SourceIndex, unpackRef } from '../../fulltext/SourceIndexSQLite';
import { ContextResult, ContextValue } from './context-provider';
import { existsSync } from 'fs';

let INDEX: SourceIndex | null = null;

let indexBuildingPromise: Promise<SourceIndex> | null = null;

async function buildIndex(filePath: string): Promise<SourceIndex> {
  const database = new sqlite3.Database(filePath);
  const sourceIndex = new SourceIndex(database);
  if (!existsSync(filePath)) await sourceIndex.buildIndex();

  return sourceIndex;
}

async function findOrCreateIndex(filePath: string): Promise<SourceIndex> {
  if (INDEX) return INDEX;

  if (indexBuildingPromise) return await indexBuildingPromise;

  indexBuildingPromise = buildIndex(filePath).then((index) => {
    INDEX = index;
    indexBuildingPromise = null;
    return index;
  });
  return await indexBuildingPromise;
}

export default async function bm25Provider(
  filePath: string,
  keywords: string[],
  charLimit: number
): Promise<ContextResult> {
  const index = await findOrCreateIndex(filePath);
  const searchResults = await index.search(keywords);

  const result = new Array<ContextValue>();
  let charCount = 0;
  for (const searchResult of searchResults) {
    const type = 'codeSnippet';
    // TODO: Select the score from the code_snippets table
    // const { score } = searchResult;
    const { ref: id, text: content } = searchResult;
    result.push({ id, type, content });
    charCount += content.length;
    if (charCount > charLimit) break;
  }
  return result;
}
