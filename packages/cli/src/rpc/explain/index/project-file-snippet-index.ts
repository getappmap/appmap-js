import sqlite3 from 'better-sqlite3';
import { warn } from 'console';

import { ContextV2 } from '@appland/navie';
import {
  buildSnippetIndex,
  FileSearchResult,
  fileTokens,
  langchainSplitter,
  readFileSafe,
  SnippetIndex,
  SnippetSearchResult,
} from '@appland/search';

import buildIndexInTempDir, { CloseableIndex } from './build-index-in-temp-dir';
import indexEvents from './index-events';
import { SearchResult } from '../../../fulltext/appmap-match';

export function snippetContextItem(
  snippet: SnippetSearchResult
): ContextV2.ContextItem | ContextV2.FileContextItem | undefined {
  const { snippetId, directory, score, content } = snippet;

  const { type: snippetIdType, id: snippetIdValue } = snippetId;

  let location: string | undefined;
  if (snippetIdType === 'code-snippet') location = snippetIdValue;

  switch (snippetId.type) {
    case 'query':
    case 'route':
    case 'external-route':
      return {
        type: ContextV2.ContextItemType.DataRequest,
        content,
        directory,
        score,
      };
    case 'code-snippet':
      return {
        type: ContextV2.ContextItemType.CodeSnippet,
        content,
        directory,
        score,
        location,
      };
    default:
      warn(`[search-context] Unknown snippet type: ${snippetId.type}`);

    // TODO: Collect all matching events, then build a sequence diagram
    // case 'event':
    //   return await buildSequenceDiagram(snippet);
    // default:
    //   codeSnippets.push(snippet);
  }
}

export async function buildProjectFileSnippetIndex(
  fileSearchResults: FileSearchResult[],
  appmapSearchResults: SearchResult[]
): Promise<CloseableIndex<SnippetIndex>> {
  const indexSnippets = async (
    db: sqlite3.Database,
    fileSearchResults: FileSearchResult[]
  ): Promise<SnippetIndex> => {
    const splitter = langchainSplitter;

    const snippetIndex = new SnippetIndex(db);
    await buildSnippetIndex(snippetIndex, fileSearchResults, readFileSafe, splitter, fileTokens);

    return snippetIndex;
  };

  return buildIndexInTempDir('snippets', async (indexFile) => {
    const db = new sqlite3(indexFile);
    const snippetIndex = await indexSnippets(db, fileSearchResults);
    await indexEvents(snippetIndex, appmapSearchResults);
    return snippetIndex;
  });
}
