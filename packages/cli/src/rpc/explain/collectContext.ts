import { SearchRpc } from '@appland/rpc';
import AppMapIndex, { SearchResponse } from '../../fulltext/AppMapIndexSQLite';
import FindEvents, {
  SearchResponse as EventSearchResponse,
  SearchResult as EventSearchResult,
} from '../../fulltext/FindEvents';
import { DEFAULT_MAX_DIAGRAMS } from '../search/search';
import buildContext from './buildContext';
import { log } from 'console';
import { isAbsolute, join } from 'path';
import { ContextValue } from '../../cmds/context-provider/context-provider';
import applyContext from '../../cmds/context-provider/applyContext';
import assert from 'assert';

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
    private appmapIndex: AppMapIndex,
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
    const keywords = this.vectorTerms;

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
      appmapSearchResponse = await this.appmapIndex.search(keywords, searchOptions);
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
    let selectedContext: {
      sequenceDiagrams: string[];
      codeSnippets: Map<string, string>;
      codeObjects: Set<string>;
    };
    let charCount = 0;
    let maxEventsPerDiagram = 5;
    log(`Requested char limit: ${this.charLimit}`);
    while (true) {
      log(`Collecting context with ${maxEventsPerDiagram} events per diagram.`);
      contextCandidate = await eventsCollector.collectEvents(maxEventsPerDiagram);

      let context = new Array<ContextValue>();
      for (const value of contextCandidate.context.sequenceDiagrams) {
        context.push({ type: 'sequenceDiagram', content: value });
      }
      for (const [key, value] of contextCandidate.context.codeSnippets.entries()) {
        context.push({ type: 'codeSnippet', id: key, content: value });
      }
      for (const value of contextCandidate.context.codeObjects) {
        context.push({ type: 'dataRequest', content: value });
      }

      // Re-arrange the context to provide a sampling of each type of content.
      log(`Sampling context with ${context.length} items to obtain ${this.charLimit} characters.`);
      context = applyContext(context, this.charLimit);

      const estimatedSize = context.map((item) => item.content.length).reduce((a, b) => a + b, 0);
      log(`Collected an estimated ${estimatedSize} characters.`);

      if (estimatedSize === charCount || estimatedSize > this.charLimit) {
        selectedContext = {
          sequenceDiagrams: context
            .filter((item) => item.type === 'sequenceDiagram')
            .map((item) => item.content),
          codeSnippets: context
            .filter((item) => item.type === 'codeSnippet')
            .reduce((map, item) => {
              assert(item.id);
              map.set(item.id, item.content);
              return map;
            }, new Map<string, string>()),
          codeObjects: new Set(
            context.filter((item) => item.type === 'dataRequest').map((item) => item.content)
          ),
        };

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
      context: selectedContext,
    };
  }
}

export default async function collectContext(
  appmapIndex: AppMapIndex,
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
  const contextCollector = new ContextCollector(appmapIndex, directories, vectorTerms, charLimit);
  if (appmaps) contextCollector.appmaps = appmaps;
  return contextCollector.collectContext();
}
