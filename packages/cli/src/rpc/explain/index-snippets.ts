import {
  buildSnippetIndex,
  FileSearchResult,
  fileTokens,
  langchainSplitter,
  readFileSafe,
  SnippetIndex,
} from '@appland/search';
import sqlite3 from 'better-sqlite3';

export default async function indexSnippets(
  db: sqlite3.Database,
  fileSearchResults: FileSearchResult[]
): Promise<SnippetIndex> {
  const splitter = langchainSplitter;

  const snippetIndex = new SnippetIndex(db);
  await buildSnippetIndex(snippetIndex, fileSearchResults, readFileSafe, splitter, fileTokens);

  return snippetIndex;
}
