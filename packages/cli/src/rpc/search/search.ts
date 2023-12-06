import assert from 'assert';

import { SearchRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import searchAppMaps from '../../cmds/search/searchAppMaps';
import { SearchResult as AppMapSearchResult } from '../../fulltext/FindAppMaps';
import searchSingleAppMap from '../../cmds/search/searchSingleAppMap';
import { SearchResult as EventSearchResult } from '../../fulltext/FindEvents';

export function search(
  appmapDir: string
): RpcHandler<SearchRpc.SearchOptions, SearchRpc.SearchResponse> {
  async function handler(args: SearchRpc.SearchOptions): Promise<SearchRpc.SearchResponse> {
    const { query, maxResults } = args;

    // Search across all AppMaps, creating a map from AppMap id to AppMapSearchResult
    const options = maxResults ? { maxResults } : {};
    const appmapSearchResponse = await searchAppMaps(appmapDir, query, options);
    const appmapSearchResults = appmapSearchResponse.results.reduce((acc, result) => {
      acc.set(result.appmap, result);
      return acc;
    }, new Map<string, AppMapSearchResult>());

    // For each AppMap, search for events within the map that match the query.
    // Sort the events by score, then group by AppMap id.
    const events = new Array<EventSearchResult>();
    for (const result of appmapSearchResponse.results) {
      const options = maxResults ? { maxResults } : {};
      const eventsSearchResponse = await searchSingleAppMap(result.appmap, query, options);
      events.push(...eventsSearchResponse.results);
    }

    events.sort((a, b) => b.score - a.score);

    const resultsByAppmapId = events.reduce((acc, event) => {
      const { appmap: appmapId } = event;

      if (!acc.has(appmapId)) {
        const appmapResult = appmapSearchResults.get(appmapId);
        assert(appmapResult);
        acc.set(appmapId, { appmap: appmapId, events: [], score: appmapResult.score });
      }
      const filteredEvent: any = { ...event };
      delete filteredEvent['appmap'];
      acc.get(appmapId)!.events.push(filteredEvent);
      return acc;
    }, new Map<string, SearchRpc.SearchResult>());

    // The final result is AppMaps sorted by search score, along with the events
    // within each AppMap, also sorted by search score.
    const results = Array.from(resultsByAppmapId.values()).sort((a, b) => b.score - a.score);
    if (maxResults) results.splice(maxResults);

    return {
      results,
      numResults: appmapSearchResponse.numResults,
    };
  }

  return { name: SearchRpc.FunctionName, handler };
}