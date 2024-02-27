import assert from 'assert';

import { SearchRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import AppMapIndex, { SearchResponse } from '../../fulltext/AppMapIndex';
import searchSingleAppMap from '../../cmds/search/searchSingleAppMap';

export type HandlerOptions = {
  maxResults?: number;
};

export async function handler(
  appmapDir: string,
  appmaps: string[] | undefined,
  query: string,
  options: HandlerOptions
): Promise<SearchRpc.SearchResponse> {
  // TODO: Add extra keywords which are searched across all the functions that are included
  // in the AppMaps.
  const { maxResults } = options;

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
    const searchOptions = maxResults ? { maxResults } : {};
    appmapSearchResponse = await AppMapIndex.search(appmapDir, query, searchOptions);
  }

  // For each AppMap, search for events within the map that match the query.
  const results = new Array<SearchRpc.SearchResult>();
  for (const result of appmapSearchResponse.results) {
    const options = maxResults ? { maxResults } : {};
    const eventsSearchResponse = await searchSingleAppMap(result.appmap, query, options);
    results.push({
      appmap: result.appmap,
      events: eventsSearchResponse.results,
      score: result.score,
    });
  }

  if (maxResults) results.splice(maxResults);

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
