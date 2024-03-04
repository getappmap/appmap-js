import assert from 'assert';

import { SearchRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import AppMapIndex, { SearchResponse } from '../../fulltext/AppMapIndex';
import searchSingleAppMap from '../../cmds/search/searchSingleAppMap';

export const DEFAULT_MAX_DIAGRAMS = 10;
export const DEFAULT_MAX_EVENTS_PER_DIAGRAM = 100;

export type HandlerOptions = {
  maxResults?: number;
  maxDiagrams?: number;
  maxEventsPerDiagram?: number;
};

export async function handler(
  appmapDir: string,
  appmaps: string[] | undefined,
  query: string,
  options: HandlerOptions
): Promise<SearchRpc.SearchResponse> {
  let appmapSearchResponse: SearchResponse;
  if (appmaps) {
    appmapSearchResponse = {
      type: 'appmap',
      stats: {
        max: 1,
        mean: 1,
        median: 1,
        stddev: 0,
      },
      results: appmaps.map((appmap) => ({ appmap, score: 1 })),
      numResults: appmaps.length,
    };
  } else {
    // Search across all AppMaps, creating a map from AppMap id to AppMapSearchResult
    const searchOptions = {
      maxResults: options.maxDiagrams || options.maxResults || DEFAULT_MAX_DIAGRAMS,
    };
    appmapSearchResponse = await AppMapIndex.search(appmapDir, query, searchOptions);
  }

  // For each AppMap, search for events within the map that match the query.
  const results = new Array<SearchRpc.SearchResult>();
  for (const result of appmapSearchResponse.results) {
    const searchOptions = {
      maxResults:
        options.maxEventsPerDiagram || options.maxResults || DEFAULT_MAX_EVENTS_PER_DIAGRAM,
    };
    const eventsSearchResponse = await searchSingleAppMap(result.appmap, query, searchOptions);
    results.push({
      appmap: result.appmap,
      events: eventsSearchResponse.results,
      score: result.score,
    });
  }

  return {
    results,
    numResults: appmapSearchResponse.numResults,
  };
}

export function search(
  appmapDir: string
): RpcHandler<SearchRpc.SearchOptions, SearchRpc.SearchResponse> {
  return {
    name: SearchRpc.FunctionName,
    handler: (args) => handler(appmapDir, args.appmaps, args.query, args),
  };
}
