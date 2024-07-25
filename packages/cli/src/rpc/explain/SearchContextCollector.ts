import { log } from 'console';
import { ContextV2, applyContext } from '@appland/navie';
import { SearchRpc } from '@appland/rpc';
import AppMapIndex, {
  SearchResponse as AppMapSearchResponse,
  SearchOptions as AppMapSearchOptions,
} from '../../fulltext/AppMapIndex';
import { DEFAULT_MAX_DIAGRAMS, DEFAULT_MAX_FILES } from '../search/search';
import { buildFileIndex } from '../../fulltext/FileIndex';
import withIndex from '../../fulltext/withIndex';
import EventCollector from './EventCollector';
import SourceCollector from './SourceCollector';

export default class SearchContextCollector {
  public excludePatterns: RegExp[] | undefined;
  public includePatterns: RegExp[] | undefined;
  public includeTypes: ContextV2.ContextItemType[] | undefined;

  query: string;

  constructor(
    private appmapDirectories: string[],
    private sourceDirectories: string[],
    private appmaps: string[] | undefined,
    private vectorTerms: string[],
    private charLimit: number
  ) {
    this.query = this.vectorTerms.join(' ');
  }

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
        this.query,
        searchOptions
      );
    }

    const fileSearchResponse = await withIndex(
      'files',
      (indexFileName: string) =>
        buildFileIndex(
          this.sourceDirectories,
          indexFileName,
          this.excludePatterns,
          this.includePatterns
        ),
      (index) => index.search(this.vectorTerms, DEFAULT_MAX_FILES)
    );

    const eventsCollector = new EventCollector(this.query, appmapSearchResponse);
    const sourceCollector = new SourceCollector(this.vectorTerms, fileSearchResponse);

    let contextCandidate: {
      results: SearchRpc.SearchResult[];
      context: ContextV2.ContextResponse;
      contextSize: number;
    };
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
      let sourceContext: ContextV2.ContextResponse = [];
      if (codeSnippetCount === 0) {
        sourceContext = await sourceCollector.collectContext(this.charLimit);
      } else {
        sourceContext = await sourceCollector.collectContext(this.charLimit / 4);
      }
      contextCandidate.context = contextCandidate.context.concat(sourceContext);

      const appliedContext = applyContext(contextCandidate.context, this.charLimit);
      const appliedContextSize = appliedContext.reduce((acc, item) => acc + item.content.length, 0);
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

    return {
      searchResponse: {
        results: contextCandidate.results,
        numResults: appmapSearchResponse.numResults,
      },
      context: contextCandidate.context,
    };
  }
}
