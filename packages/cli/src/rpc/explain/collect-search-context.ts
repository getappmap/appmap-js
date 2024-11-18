import { log } from 'console';

import { ContextV2, applyContext } from '@appland/navie';
import { SearchRpc } from '@appland/rpc';

import { DEFAULT_MAX_DIAGRAMS } from '../search/search';
import { SearchResponse as AppMapSearchResponse } from '../../fulltext/appmap-match';
import { searchAppMapFiles } from './index/appmap-file-index';
import { searchProjectFiles } from './index/project-file-index';
import {
  buildProjectFileSnippetIndex,
  snippetContextItem,
} from './index/project-file-snippet-index';

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
    const selectedAppMaps = await searchAppMapFiles(
      appmapDirectories,
      vectorTerms,
      DEFAULT_MAX_DIAGRAMS
    );

    appmapSearchResponse = {
      results: selectedAppMaps.results,
      numResults: selectedAppMaps.results.length,
      stats: selectedAppMaps.stats,
      type: 'appmap',
    };

    log(`[search-context] Matched ${selectedAppMaps.results.length} AppMaps.`);
  }

  const fileSearchResults = await searchProjectFiles(
    sourceDirectories,
    request.includePatterns,
    request.excludePatterns,
    vectorTerms
  );

  const snippetIndex = await buildProjectFileSnippetIndex(
    fileSearchResults,
    appmapSearchResponse.results
  );
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
