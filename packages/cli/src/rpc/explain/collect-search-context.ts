import { log } from 'console';

import { ContextV2, applyContext } from '@appland/navie';
import { SearchRpc } from '@appland/rpc';

import { DEFAULT_MAX_DIAGRAMS } from '../search/search';
import { SearchResponse as AppMapSearchResponse } from './index/appmap-match';
import { searchAppMapFiles } from './index/appmap-file-index';
import { searchProjectFiles } from './index/project-file-index';
import { buildProjectFileSnippetIndex } from './index/project-file-snippet-index';
import { generateSessionId } from '@appland/search';

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
  const sessionId = generateSessionId();

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
      numResults: results.length,
    };
  } else {
    const selectedAppMaps = await searchAppMapFiles(
      sessionId,
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
    sessionId,
    sourceDirectories,
    request.includePatterns,
    request.excludePatterns,
    vectorTerms
  );

  const snippetIndex = await buildProjectFileSnippetIndex(
    sessionId,
    vectorTerms,
    appmapSearchResponse,
    fileSearchResults
  );

  let contextCandidate: {
    results: SearchRpc.SearchResult[];
    context: ContextV2.ContextResponse;
    contextSize: number;
  };
  try {
    let charCount = 0;
    let maxEventsPerDiagram = 5;
    log(`[search-context] Requested char limit: ${charLimit}`);
    for (;;) {
      log(`[search-context] Collecting context with ${maxEventsPerDiagram} events per diagram.`);

      contextCandidate = await snippetIndex.search(maxEventsPerDiagram, charLimit, request);
      const appliedContext = applyContext(contextCandidate.context, charLimit);
      const appliedContextSize = appliedContext.reduce((acc, item) => acc + item.content.length, 0);
      contextCandidate.context = appliedContext;
      contextCandidate.contextSize = appliedContextSize;
      log(`[search-context] Collected an estimated ${appliedContextSize} characters.`);

      if (appliedContextSize === charCount || appliedContextSize > charLimit) {
        break;
      }
      charCount = appliedContextSize;
      maxEventsPerDiagram = Math.ceil(maxEventsPerDiagram * 1.5);
      log(`[search-context] Increasing max events per diagram to ${maxEventsPerDiagram}.`);
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
