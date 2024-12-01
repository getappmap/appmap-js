import { isAbsolute, join } from 'path';
import sqlite3 from 'better-sqlite3';
import { FileIndex, generateSessionId } from '@appland/search';
import { SearchRpc } from '@appland/rpc';

import { RpcHandler } from '../rpc';
import { SearchResponse } from '../explain/index/appmap-match';
import { search as searchAppMaps } from '../explain/index/appmap-index';
import searchSingleAppMap from '../../cmds/search/searchSingleAppMap';
import configuration, { AppMapDirectory } from '../configuration';
import buildIndexInTempDir from '../explain/index/build-index-in-temp-dir';
import { buildAppMapIndex } from '../explain/index/appmap-index';

export const DEFAULT_MAX_DIAGRAMS = 10;
export const DEFAULT_MAX_EVENTS_PER_DIAGRAM = 100;
export const DEFAULT_MAX_FILES = 10;

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
  const sessionId = generateSessionId();

  const appmapDirectories = await config.appmapDirectories();
  let appmapSearchResponse: SearchResponse;
  if (appmaps) {
    const results = appmaps
      .map((appmap) => {
        let appmapDirectory: AppMapDirectory | undefined;
        if (appmapDirectories.length === 1) appmapDirectory = appmapDirectories[0];
        else appmapDirectory = appmapDirectories.find((dir) => appmap.startsWith(dir.directory));
        if (!appmapDirectory) return undefined;

        const appmapId = isAbsolute(appmap) ? appmap : join(appmapDirectory.directory, appmap);
        return {
          appmap: appmapId,
          directory: appmapDirectory.directory,
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
    const maxResults = options.maxDiagrams || options.maxResults || DEFAULT_MAX_DIAGRAMS;
    const index = await buildIndexInTempDir('appmaps', async (indexFile) => {
      const db = new sqlite3(indexFile);
      const fileIndex = new FileIndex(db);
      await buildAppMapIndex(
        fileIndex,
        appmapDirectories.map((d) => d.directory)
      );
      return fileIndex;
    });

    appmapSearchResponse = await searchAppMaps(
      index.index,
      sessionId,
      query.split(/\s+/).join(' OR '),
      maxResults
    );
    index.close();
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
