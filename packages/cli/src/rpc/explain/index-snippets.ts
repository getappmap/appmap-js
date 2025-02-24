import sqlite3 from 'node-sqlite3-wasm';

import {
  buildSnippetIndex,
  FileSearchResult,
  fileTokens,
  langchainSplitter,
  readFileSafe,
  SnippetIndex,
} from '@appland/search';

export default async function indexSnippets(
  db: sqlite3.Database,
  fileSearchResults: FileSearchResult[]
): Promise<SnippetIndex> {
  const splitter = langchainSplitter;

  const snippetIndex = new SnippetIndex(db);
  await buildSnippetIndex(snippetIndex, fileSearchResults, readFileSafe, splitter, fileTokens);

  return snippetIndex;
}
