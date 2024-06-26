import { SearchRpc } from '@appland/rpc';
import AppMapIndex, {
  SearchResponse as AppMapSearchResponse,
  SearchOptions as AppMapSearchOptions,
} from '../../fulltext/AppMapIndex';
import FindEvents, {
  SearchResponse as EventSearchResponse,
  SearchResult as EventSearchResult,
  SearchOptions as EventsSearchOptions,
} from '../../fulltext/FindEvents';
import { DEFAULT_MAX_DIAGRAMS, DEFAULT_MAX_FILES } from '../search/search';
import buildContext from './buildContext';
import { log, warn } from 'console';
import { isAbsolute, join } from 'path';
import { ContextV2, applyContext } from '@appland/navie';
import { FileIndexMatch, buildFileIndex } from '../../fulltext/FileIndex';
import withIndex from '../../fulltext/withIndex';
import { SourceIndexMatch, buildSourceIndex } from '../../fulltext/SourceIndex';

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

  constructor(private query: string, private appmapSearchResponse: AppMapSearchResponse) {}

  async collectEvents(
    maxEvents: number,
    excludePatterns?: RegExp[],
    includePatterns?: RegExp[],
    includeTypes?: ContextV2.ContextItemType[]
  ): Promise<{
    results: SearchRpc.SearchResult[];
    context: ContextV2.ContextResponse;
    contextSize: number;
  }> {
    const results = new Array<SearchRpc.SearchResult>();

    for (const result of this.appmapSearchResponse.results) {
      let { appmap } = result;
      if (!isAbsolute(appmap)) appmap = join(result.directory, appmap);

      const options: EventsSearchOptions = {
        maxResults: maxEvents,
      };
      if (includePatterns) options.includePatterns = includePatterns;
      if (excludePatterns) options.excludePatterns = excludePatterns;

      const eventsSearchResponse = await this.findEvents(appmap, options);
      results.push({
        appmap: appmap,
        directory: result.directory,
        events: eventsSearchResponse.results.map(textSearchResultToRpcSearchResult),
        score: result.score,
      });
    }

    const isIncludedType = (item: ContextV2.ContextItem) => {
      if (includeTypes && !includeTypes.some((type) => type === item.type)) return false;

      return true;
    };

    const context = (await buildContext(results)).filter(isIncludedType);

    const contextSize = context.reduce((acc, item) => acc + item.content.length, 0);

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

  async findEvents(appmap: string, options: AppMapSearchOptions): Promise<EventSearchResponse> {
    if (appmap.endsWith('.appmap.json')) appmap = appmap.slice(0, -'.appmap.json'.length);

    const index = await this.appmapIndex(appmap);
    return index.search(this.query, options);
  }
}

const CHARS_PER_SNIPPET = 50;

export class SourceCollector {
  constructor(private keywords: string[], private fileSearchResponse: FileIndexMatch[]) {}

  async collectContext(charLimit: number): Promise<ContextV2.ContextItem[]> {
    const sourceIndexDocuments = await withIndex(
      'source',
      (indexFileName: string) => buildSourceIndex(indexFileName, this.fileSearchResponse),
      (index) => index.search(this.keywords, Math.round(charLimit / CHARS_PER_SNIPPET))
    );

    const buildLocation = (doc: SourceIndexMatch) => {
      return `${doc.fileName}:${doc.from}-${doc.to}`;
    };

    return sourceIndexDocuments.map((doc: SourceIndexMatch) => ({
      directory: doc.directory,
      type: ContextV2.ContextItemType.CodeSnippet,
      content: doc.content,
      location: buildLocation(doc),
    }));
  }
}

export class ContextCollector {
  public appmaps: string[] | undefined;
  public excludePatterns: RegExp[] | undefined;
  public includePatterns: RegExp[] | undefined;
  public includeTypes: ContextV2.ContextItemType[] | undefined;

  query: string;

  constructor(
    private appmapDirectories: string[],
    private sourceDirectories: string[],
    private vectorTerms: string[],
    private charLimit: number
  ) {
    this.query = vectorTerms.join(' ');
  }

  async collectContext(): Promise<{
    searchResponse: SearchRpc.SearchResponse;
    context: ContextV2.ContextResponse;
  }> {
    if (this.vectorTerms.length === 0 || this.vectorTerms.every((term) => term.trim() === '')) {
      warn('No vector terms received. Context search will be skipped.');
      return { searchResponse: { results: [], numResults: 0 }, context: [] };
    }

    const query = this.vectorTerms.join(' ');

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
      appmapSearchResponse = await AppMapIndex.search(this.appmapDirectories, query, searchOptions);
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
    log(`Requested char limit: ${this.charLimit}`);
    for (;;) {
      log(`Collecting context with ${maxEventsPerDiagram} events per diagram.`);

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
      log(`Collected an estimated ${appliedContextSize} characters.`);

      if (appliedContextSize === charCount || appliedContextSize > this.charLimit) {
        break;
      }
      charCount = appliedContextSize;
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
  appmapDirectories: string[],
  sourceDirectories: string[],
  appmaps: string[] | undefined,
  vectorTerms: string[],
  charLimit: number,
  filters: ContextV2.ContextFilters
): Promise<{
  searchResponse: SearchRpc.SearchResponse;
  context: ContextV2.ContextResponse;
}> {
  const contextCollector = new ContextCollector(
    appmapDirectories,
    sourceDirectories,
    vectorTerms,
    charLimit
  );
  if (appmaps) contextCollector.appmaps = appmaps;

  if (filters?.exclude)
    contextCollector.excludePatterns = filters.exclude.map((pattern) => new RegExp(pattern));
  if (filters?.include)
    contextCollector.includePatterns = filters.include.map((pattern) => new RegExp(pattern));
  if (filters?.itemTypes) contextCollector.includeTypes = filters.itemTypes.map((type) => type);

  return await contextCollector.collectContext();
}
