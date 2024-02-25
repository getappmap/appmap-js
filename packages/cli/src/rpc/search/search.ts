import { SearchRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import AppMapIndex, {
  SearchResult as AppMapSearchResult,
  SearchOptions,
  SearchResponse,
} from '../../fulltext/AppMapIndex';
import searchSingleAppMap, { SearchSingleMapOptions } from '../../cmds/search/searchSingleAppMap';
import assert from 'assert';

export type HandlerOptions = {
  appmapDir?: string;
  appmaps?: string[];
  maxResults?: number;
  threshold?: number;
};

export async function handler(
  query: string,
  options: HandlerOptions
): Promise<SearchRpc.SearchResponse> {
  assert(options.appmapDir || options.appmaps, 'appmapDir or appmaps must be provided');

  // TODO: Add extra keywords which are searched across all the functions that are included
  // in the AppMaps.
  const { maxResults, threshold: thresholdArg } = options;
  const threshold = thresholdArg || 0.5;
  let appmapSearchResponse: SearchResponse;
  if (options.appmaps) {
    const results = options.appmaps.map((appmap) => ({ appmap, score: 1 }));
    const stats = {
      mean: 1,
      median: 1,
      stddev: 0,
      max: 1,
    };
    appmapSearchResponse = {
      type: 'appmap',
      results,
      stats,
      numResults: results.length,
    };
  } else {
    assert(options.appmapDir);
    const searchOptions = new SearchOptions();
    if (maxResults) searchOptions.maxResults = maxResults;
    // TODO: Filter AppMap matches by threshold
    appmapSearchResponse = await AppMapIndex.search(options.appmapDir, query, searchOptions);
  }

  const results = new Array<SearchRpc.SearchResult>();
  for (const result of appmapSearchResponse.results) {
    const options: SearchSingleMapOptions = { maxResults, threshold };
    const eventsSearchResponse = await searchSingleAppMap(result.appmap, query, options);
    results.push({
      appmap: result.appmap,
      events: eventsSearchResponse.results,
      eventStats: eventsSearchResponse.stats,
      score: result.score,
    });
  }

  if (maxResults) results.splice(maxResults);

  return {
    results,
    searchStats: appmapSearchResponse.stats,
    numResults: appmapSearchResponse.numResults,
  };
}

export function search(
  appmapDir: string
): RpcHandler<SearchRpc.SearchOptions, SearchRpc.SearchResponse> {
  return {
    name: SearchRpc.FunctionName,
    handler: (args) => {
      const options: HandlerOptions = { ...args };
      if (!args.appmaps) options.appmapDir = appmapDir;
      return handler(args.query, args);
    },
  };
}
