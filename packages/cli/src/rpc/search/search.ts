import assert from 'assert';

import { SearchRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import AppMapIndex, { SearchResponse } from '../../fulltext/AppMapIndex';
import searchSingleAppMap from '../../cmds/search/searchSingleAppMap';
import configuration from '../configuration';
import { dir } from 'console';
import { isAbsolute, join } from 'path';

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
  const { directories } = config;
  let appmapSearchResponse: SearchResponse;
  if (appmaps) {
    const results = appmaps
      .map((appmap) => {
        let directory: string | undefined;
        if (directories.length === 1) directory = directories[0];
        else directory = directories.find((dir) => appmap.startsWith(dir));
        if (!directory) return undefined;

        const appmapId = isAbsolute(appmap) ? appmap : join(directory, appmap);
        return {
          appmap: appmapId,
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
      numResults: appmaps.length,
    };
  } else {
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
    let appmap = result.appmap;
    if (!isAbsolute(appmap)) appmap = join(result.directory, appmap);

    const eventsSearchResponse = await searchSingleAppMap(appmap, query, searchOptions);
    results.push({
      appmap,
      directory: result.directory,
      events: eventsSearchResponse.results.map((event) => {
        delete (event as any).appmap;
        return event;
      }),
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
