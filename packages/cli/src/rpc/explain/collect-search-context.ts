import { log, warn } from 'console';
import sqlite3 from 'better-sqlite3';

import { ContextV2, applyContext } from '@appland/navie';
import { SearchRpc } from '@appland/rpc';
import { FileIndex, FileSearchResult, SnippetSearchResult } from '@appland/search';

import indexFiles from './index-files';
import indexSnippets from './index-snippets';
import buildIndexInTempDir from './build-index-in-temp-dir';
import indexEvents from './index-events';

import { SearchResponse as AppMapSearchResponse } from '../../fulltext/appmap-match';
import { DEFAULT_MAX_DIAGRAMS } from '../search/search';
import { buildAppMapIndex, search } from '../../fulltext/appmap-index';

type ContextCandidate = {
  results: SearchRpc.SearchResult[];
  context: ContextV2.ContextResponse;
  contextSize: number;
};

export type SearchContextRequest = {
  appmaps?: string[];
  excludePatterns?: RegExp[];
  includePatterns?: RegExp[];
  includeTypes?: ContextV2.ContextItemType[];
};

export default async function collectSearchContext(
  appmapDirectories: string[],
  sourceDirectories: string[],
  vectorTerms: string[],
  charLimit: number,
  request: SearchContextRequest = {}
): Promise<{
  searchResponse: SearchRpc.SearchResponse;
  context: ContextV2.ContextResponse;
}> {
  let appmapSearchResponse: AppMapSearchResponse;
  if (request.appmaps) {
    const results = request.appmaps
      .map((appmap) => {
        const directory = appmapDirectories.find((dir) => appmap.startsWith(dir));
        if (!directory) return undefined;

        return {
          appmap,
          directory,
          score: 1,
        };
      })
      .filter(Boolean) as SearchRpc.SearchResult[];
    appmapSearchResponse = {
      type: 'appmap',
      stats: {
        max: 1,
        mean: 1,
        median: 1,
        stddev: 0,
      },
      results,
      numResults: request.appmaps.length,
    };
  } else {
    const appmapIndex = await buildIndexInTempDir('appmaps', async (indexFile) => {
      const db = new sqlite3(indexFile);
      const fileIndex = new FileIndex(db);
      await buildAppMapIndex(fileIndex, appmapDirectories);
      return fileIndex;
    });
    const selectedAppMaps = await search(
      appmapIndex.index,
      vectorTerms.join(' OR '),
      DEFAULT_MAX_DIAGRAMS
    );
    appmapIndex.close();

    appmapSearchResponse = {
      results: selectedAppMaps.results,
      numResults: selectedAppMaps.results.length,
      stats: selectedAppMaps.stats,
      type: 'appmap',
    };

    log(`[search-context] Matched ${selectedAppMaps.results.length} AppMaps.`);
  }

  const fileIndex = await buildIndexInTempDir('files', async (indexFile) => {
    const db = new sqlite3(indexFile);
    return await indexFiles(
      db,
      sourceDirectories,
      request.includePatterns,
      request.excludePatterns
    );
  });
  let fileSearchResults: FileSearchResult[];
  try {
    fileSearchResults = fileIndex.index.search(vectorTerms.join(' OR '));
  } finally {
    fileIndex.close();
  }

  const snippetIndex = await buildIndexInTempDir('snippets', async (indexFile) => {
    const db = new sqlite3(indexFile);
    const snippetIndex = await indexSnippets(db, fileSearchResults);
    await indexEvents(snippetIndex, appmapSearchResponse.results);
    return snippetIndex;
  });

  let contextCandidate: ContextCandidate;
  try {
    let charCount = 0;
    let maxSnippets = 50;
    log(`[search-context] Requested char limit: ${charLimit}`);
    for (;;) {
      log(`[search-context] Collecting context with ${maxSnippets} events per diagram.`);

      // Collect all code objects from AppMaps and use them to build the sequence diagram
      // const codeSnippets = new Array<SnippetSearchResult>();
      // TODO: Apply this.includeTypes

      const snippetContextItem = (
        snippet: SnippetSearchResult
      ): ContextV2.ContextItem | ContextV2.FileContextItem | undefined => {
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
      };

      const snippetSearchResults = snippetIndex.index.searchSnippets(
        vectorTerms.join(' OR '),
        maxSnippets
      );
      const context: ContextV2.ContextItem[] = [];
      for (const result of snippetSearchResults) {
        const contextItem = snippetContextItem(result);
        if (contextItem) context.push(contextItem);
      }

      // TODO: Build sequence diagrams

      contextCandidate = {
        // TODO: Fixme remove hard coded cast
        results: appmapSearchResponse.results as SearchRpc.SearchResult[],
        context,
        contextSize: snippetSearchResults.reduce((acc, result) => acc + result.content.length, 0),
      };

      const appliedContext = applyContext(contextCandidate.context, charLimit);
      const appliedContextSize = appliedContext.reduce((acc, item) => acc + item.content.length, 0);
      contextCandidate.context = appliedContext;
      contextCandidate.contextSize = appliedContextSize;
      log(`[search-context] Collected an estimated ${appliedContextSize} characters.`);

      if (appliedContextSize === charCount || appliedContextSize > charLimit) {
        break;
      }
      charCount = appliedContextSize;
      maxSnippets = Math.ceil(maxSnippets * 1.5);
      log(`[search-context] Increasing max events per diagram to ${maxSnippets}.`);
    }
  } finally {
    snippetIndex.close();
  }

  return {
    searchResponse: {
      results: contextCandidate.results,
      numResults: appmapSearchResponse.numResults,
    },
    context: contextCandidate.context,
  };
}
