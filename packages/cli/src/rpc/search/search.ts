import assert from 'assert';

import { SearchRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import AppMapIndex, { SearchResponse } from '../../fulltext/AppMapIndex';
import searchSingleAppMap from '../../cmds/search/searchSingleAppMap';
import configuration from '../configuration';

export const DEFAULT_MAX_DIAGRAMS = 10;
export const DEFAULT_MAX_EVENTS_PER_DIAGRAM = 100;

export type HandlerOptions = {
  maxResults?: number;
  maxDiagrams?: number;
  maxEventsPerDiagram?: number;
};

export async function handler(
  query: string,
  appmaps: string[] | undefined,
  options: HandlerOptions
): Promise<SearchRpc.SearchResponse> {
  const config = configuration();
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
    const { directories } = config;
    // Search across all AppMaps, creating a map from AppMap id to AppMapSearchResult
    const searchOptions = {
      maxResults: options.maxDiagrams || options.maxResults || DEFAULT_MAX_DIAGRAMS,
    };
    appmapSearchResponse = await AppMapIndex.search(directories, query, searchOptions);
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

export function search(): RpcHandler<SearchRpc.SearchOptions, SearchRpc.SearchResponse> {
  return {
    name: SearchRpc.FunctionName,
    handler: (args) => handler(args.query, args.appmaps, args),
  };
}
