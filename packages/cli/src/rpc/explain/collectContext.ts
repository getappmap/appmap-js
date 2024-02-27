import { SearchRpc } from '@appland/rpc';
import AppMapIndex, { SearchResponse } from '../../fulltext/AppMapIndex';
import { SearchResponse as EventsSearchResponse } from '../../fulltext/FindEvents';
import { DEFAULT_MAX_DIAGRAMS } from '../search/search';
import buildContext from './buildContext';
import FindEvents from '../../fulltext/FindEvents';
import { log } from 'console';

export default async function collectContext(
  appmapDir: string,
  appmaps: string[] | undefined,
  vectorTerms: string[],
  charLimit: number
): Promise<{
  sequenceDiagrams: string[];
  codeSnippets: Map<string, string>;
  codeObjects: Set<string>;
}> {
  const query = vectorTerms.join(' ');

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
      maxResults: DEFAULT_MAX_DIAGRAMS,
    };
    appmapSearchResponse = await AppMapIndex.search(appmapDir, query, searchOptions);
  }

  // Having selected up to DEFAULT_MAX_DIAGRAMS appmaps, search for events within the map that match the query.
  // Evaluate the number of characters in the response, and iterate until the response exceeds the charLimit.

  let maxEventsPerDiagram = 5;
  const appmapIndexes = new Map<string, FindEvents>();

  async function appmapIndex(appmap: string): Promise<FindEvents> {
    let index = appmapIndexes.get(appmap);
    if (!index) {
      index = new FindEvents(appmap);
      await index.initialize();
      appmapIndexes.set(appmap, index);
    }
    return index;
  }

  async function findEvents(appmap: string, query: string): Promise<EventsSearchResponse> {
    if (appmap.endsWith('.appmap.json')) appmap = appmap.slice(0, -'.appmap.json'.length);

    const index = await appmapIndex(appmap);
    return index.search(query, { maxResults: maxEventsPerDiagram });
  }

  async function collectEvents(): Promise<{
    sequenceDiagrams: string[];
    codeSnippets: Map<string, string>;
    codeObjects: Set<string>;
  }> {
    const results = new Array<SearchRpc.SearchResult>();
    for (const result of appmapSearchResponse.results) {
      const eventsSearchResponse = await findEvents(result.appmap, query);
      results.push({
        appmap: result.appmap,
        events: eventsSearchResponse.results,
        score: result.score,
      });
    }
    return await buildContext(results);
  }

  function contextSize(context: {
    sequenceDiagrams: string[];
    codeSnippets: Map<string, string>;
    codeObjects: Set<string>;
  }) {
    return (
      context.sequenceDiagrams.join('').length +
      Array.from(context.codeSnippets.values()).join('').length +
      [...context.codeObjects].join('').length
    );
  }

  let charCount = 0;
  let context: {
    sequenceDiagrams: string[];
    codeSnippets: Map<string, string>;
    codeObjects: Set<string>;
  };
  log(`Requested char limit: ${charLimit}`);
  while (true) {
    log(`Collecting context with ${maxEventsPerDiagram} events per diagram.`);
    context = await collectEvents();
    const estimatedSize = contextSize(context);
    log(`Collected an estimated ${estimatedSize} characters.`);
    if (estimatedSize === charCount || estimatedSize > charLimit) {
      break;
    }
    charCount = estimatedSize;
    maxEventsPerDiagram = Math.ceil(maxEventsPerDiagram * 1.5);
    log(`Increasing max events per diagram to ${maxEventsPerDiagram}.`);
  }

  return context;
}
