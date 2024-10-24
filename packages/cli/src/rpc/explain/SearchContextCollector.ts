import { log } from 'console';
import sqlite3 from 'better-sqlite3';

import { ContextV2, applyContext } from '@appland/navie';
import { SearchRpc } from '@appland/rpc';
import AppMapIndex, {
  SearchResponse as AppMapSearchResponse,
  SearchOptions as AppMapSearchOptions,
} from '../../fulltext/AppMapIndex';
import { DEFAULT_MAX_DIAGRAMS } from '../search/search';
import EventCollector from './EventCollector';
import indexFiles from './index-files';
import indexSnippets from './index-snippets';
import collectSnippets from './collect-snippets';

export default class SearchContextCollector {
  public excludePatterns: RegExp[] | undefined;
  public includePatterns: RegExp[] | undefined;
  public includeTypes: ContextV2.ContextItemType[] | undefined;

  constructor(
    private appmapDirectories: string[],
    private sourceDirectories: string[],
    private appmaps: string[] | undefined,
    private vectorTerms: string[],
    private charLimit: number
  ) {}

  async collectContext(): Promise<{
    searchResponse: SearchRpc.SearchResponse;
    context: ContextV2.ContextResponse;
  }> {
    let appmapSearchResponse: AppMapSearchResponse;
    if (this.appmaps) {
      const results = this.appmaps
        .map((appmap) => {
          const directory = this.appmapDirectories.find((dir) => appmap.startsWith(dir));
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
      const searchOptions: AppMapSearchOptions = {
        maxResults: DEFAULT_MAX_DIAGRAMS,
      };
      appmapSearchResponse = await AppMapIndex.search(
        this.appmapDirectories,
        this.vectorTerms.join(' '),
        searchOptions
      );
    }

    const db = new sqlite3(':memory:');
    const fileIndex = await indexFiles(db, this.sourceDirectories);
    const fileSearchResults = fileIndex.search(this.vectorTerms.join(' OR '));
    let contextCandidate: {
      results: SearchRpc.SearchResult[];
      context: ContextV2.ContextResponse;
      contextSize: number;
    };
    try {
      const eventsCollector = new EventCollector(this.vectorTerms.join(' '), appmapSearchResponse);
      const snippetIndex = await indexSnippets(db, fileSearchResults);

      let charCount = 0;
      let maxEventsPerDiagram = 5;
      log(`[search-context] Requested char limit: ${this.charLimit}`);
      for (;;) {
        log(`[search-context] Collecting context with ${maxEventsPerDiagram} events per diagram.`);

        contextCandidate = await eventsCollector.collectEvents(
          maxEventsPerDiagram,
          this.excludePatterns,
          this.includePatterns,
          this.includeTypes
        );

        const codeSnippetCount = contextCandidate.context.filter(
          (item) => item.type === ContextV2.ContextItemType.CodeSnippet
        ).length;

        const charLimit = codeSnippetCount === 0 ? this.charLimit : this.charLimit / 4;
        const sourceContext = collectSnippets(
          snippetIndex,
          this.vectorTerms.join(' OR '),
          charLimit
        );
        contextCandidate.context = contextCandidate.context.concat(sourceContext);

        const appliedContext = applyContext(contextCandidate.context, this.charLimit);
        const appliedContextSize = appliedContext.reduce(
          (acc, item) => acc + item.content.length,
          0
        );
        contextCandidate.context = appliedContext;
        contextCandidate.contextSize = appliedContextSize;
        log(`[search-context] Collected an estimated ${appliedContextSize} characters.`);

        if (appliedContextSize === charCount || appliedContextSize > this.charLimit) {
          break;
        }
        charCount = appliedContextSize;
        maxEventsPerDiagram = Math.ceil(maxEventsPerDiagram * 1.5);
        log(`[search-context] Increasing max events per diagram to ${maxEventsPerDiagram}.`);
      }
    } finally {
      db.close();
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
