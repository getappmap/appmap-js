import assert from 'assert';

import { SearchRpc } from '@appland/rpc';
import { RpcCallback, RpcError, RpcHandler } from '../rpc';
import searchAppMaps from '../../cmds/search/searchAppMaps';
import {
  SearchResponse as AppMapSearchResponse,
  SearchResult as AppMapSearchResult,
} from '../../fulltext/FindAppMaps';
import searchSingleAppMap from '../../cmds/search/searchSingleAppMap';
import {
  SearchResponse as EventsSearchResponse,
  SearchResult as EventSearchResult,
} from '../../fulltext/FindEvents';

export function search(
  appmapDir: string
): RpcHandler<SearchRpc.SearchOptions, SearchRpc.SearchResponse> {
  async function handler(
    args: SearchRpc.SearchOptions,
    callback: RpcCallback<SearchRpc.SearchResponse>
  ) {
    const { query, maxResults } = args;

    // Search across all AppMaps, creating a map from AppMap id to AppMapSearchResult
    let appmapSearchResponse: AppMapSearchResponse;
    try {
      const options = maxResults ? { maxResults } : {};
      appmapSearchResponse = await searchAppMaps(appmapDir, query, options);
    } catch (err) {
      const error: RpcError = { code: 500 };
      if (err instanceof Error) error.message = err.message;
      return callback(error);
    }
    const appmapSearchResults = appmapSearchResponse.results.reduce((acc, result) => {
      acc.set(result.appmap, result);
      return acc;
    }, new Map<string, AppMapSearchResult>());

    // For each AppMap, search for events within the map that match the query.
    // Sort the events by score, then group by AppMap id.
    const events = new Array<EventSearchResult>();
    for (const result of appmapSearchResponse.results) {
      let eventsSearchResponse: EventsSearchResponse;
      try {
        const options = maxResults ? { maxResults } : {};
        eventsSearchResponse = await searchSingleAppMap(result.appmap, query, options);
      } catch (err) {
        const error: RpcError = { code: 500 };
        if (err instanceof Error) error.message = err.message;
        return callback(error);
      }
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

    callback(null, {
      results,
      numResults: appmapSearchResponse.numResults,
    });
  }

  return { name: SearchRpc.FunctionName, handler };
}
