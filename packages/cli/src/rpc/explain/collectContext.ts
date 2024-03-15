import { SearchRpc } from '@appland/rpc';
import AppMapIndex, { SearchResponse } from '../../fulltext/AppMapIndex';
import FindEvents, {
  SearchResponse as EventSearchResponse,
  SearchResult as EventSearchResult,
} from '../../fulltext/FindEvents';
import { DEFAULT_MAX_DIAGRAMS } from '../search/search';
import buildContext from './buildContext';
import { log } from 'console';
import { isAbsolute, join } from 'path';

export function textSearchResultToRpcSearchResult(
  eventResult: EventSearchResult
): SearchRpc.EventMatch {
  const result: SearchRpc.EventMatch = {
    fqid: eventResult.fqid,
    score: eventResult.score,
    eventIds: eventResult.eventIds,
  };
  if (eventResult.location) result.location = eventResult.location;
  if (eventResult.elapsed) result.elapsed = eventResult.elapsed;
  return result;
}

export class EventCollector {
  appmapIndexes = new Map<string, FindEvents>();

  constructor(private query: string, private appmapSearchResponse: SearchResponse) {}

  async collectEvents(maxEvents: number): Promise<{
    results: SearchRpc.SearchResult[];
    context: {
      sequenceDiagrams: string[];
      codeSnippets: Map<string, string>;
      codeObjects: Set<string>;
    };
    contextSize: number;
  }> {
    const results = new Array<SearchRpc.SearchResult>();

    for (const result of this.appmapSearchResponse.results) {
      let { appmap } = result;
      if (!isAbsolute(appmap)) appmap = join(result.directory, appmap);

      const eventsSearchResponse = await this.findEvents(appmap, maxEvents);
      results.push({
        appmap: appmap,
        directory: result.directory,
        events: eventsSearchResponse.results.map(textSearchResultToRpcSearchResult),
        score: result.score,
      });
    }
    const context = await buildContext(results);

    const contextSize =
      context.sequenceDiagrams.join('').length +
      Array.from(context.codeSnippets.values()).join('').length +
      [...context.codeObjects].join('').length;

    return { results, context, contextSize };
  }

  async appmapIndex(appmap: string): Promise<FindEvents> {
    let index = this.appmapIndexes.get(appmap);
    if (!index) {
      index = new FindEvents(appmap);
      await index.initialize();
      this.appmapIndexes.set(appmap, index);
    }
    return index;
  }

  async findEvents(appmap: string, maxResults: number): Promise<EventSearchResponse> {
    if (appmap.endsWith('.appmap.json')) appmap = appmap.slice(0, -'.appmap.json'.length);

    const index = await this.appmapIndex(appmap);
    return index.search(this.query, { maxResults });
  }
}

export class ContextCollector {
  public appmaps: string[] | undefined;

  query: string;

  constructor(
    private directories: string[],
    private vectorTerms: string[],
    private charLimit: number
  ) {
    this.query = vectorTerms.join(' ');
  }

  async collectContext(): Promise<{
    searchResponse: SearchRpc.SearchResponse;
    context: {
      sequenceDiagrams: string[];
      codeSnippets: Map<string, string>;
      codeObjects: Set<string>;
    };
  }> {
    const query = this.vectorTerms.join(' ');

    let appmapSearchResponse: SearchResponse;
    if (this.appmaps) {
      const results = this.appmaps
        .map((appmap) => {
          const directory = this.directories.find((dir) => appmap.startsWith(dir));
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
        numResults: this.appmaps.length,
      };
    } else {
      // Search across all AppMaps, creating a map from AppMap id to AppMapSearchResult
      const searchOptions = {
        maxResults: DEFAULT_MAX_DIAGRAMS,
      };
      appmapSearchResponse = await AppMapIndex.search(this.directories, query, searchOptions);
    }

    const eventsCollector = new EventCollector(this.query, appmapSearchResponse);

    let contextCandidate: {
      results: SearchRpc.SearchResult[];
      context: {
        sequenceDiagrams: string[];
        codeSnippets: Map<string, string>;
        codeObjects: Set<string>;
      };
      contextSize: number;
    };
    let charCount = 0;
    let maxEventsPerDiagram = 5;
    log(`Requested char limit: ${this.charLimit}`);
    while (true) {
      log(`Collecting context with ${maxEventsPerDiagram} events per diagram.`);
      contextCandidate = await eventsCollector.collectEvents(maxEventsPerDiagram);
      const estimatedSize = contextCandidate.contextSize;
      log(`Collected an estimated ${estimatedSize} characters.`);
      if (estimatedSize === charCount || estimatedSize > this.charLimit) {
        break;
      }
      charCount = estimatedSize;
      maxEventsPerDiagram = Math.ceil(maxEventsPerDiagram * 1.5);
      log(`Increasing max events per diagram to ${maxEventsPerDiagram}.`);
    }

    return {
      searchResponse: {
        results: contextCandidate.results,
        numResults: appmapSearchResponse.numResults,
      },
      context: contextCandidate.context,
    };
  }
}

export default async function collectContext(
  directories: string[],
  appmaps: string[] | undefined,
  vectorTerms: string[],
  charLimit: number
): Promise<{
  searchResponse: SearchRpc.SearchResponse;
  context: {
    sequenceDiagrams: string[];
    codeSnippets: Map<string, string>;
    codeObjects: Set<string>;
  };
}> {
  const contextCollector = new ContextCollector(directories, vectorTerms, charLimit);
  if (appmaps) contextCollector.appmaps = appmaps;
  return contextCollector.collectContext();
}
