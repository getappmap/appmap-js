import { readFile } from 'fs/promises';
import { dir, log, warn } from 'console';
import { isAbsolute, join } from 'path';
import { ContextV2, applyContext } from '@appland/navie';
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
import { FileIndexMatch, buildFileIndex } from '../../fulltext/FileIndex';
import withIndex from '../../fulltext/withIndex';
import { SourceIndexMatch, buildSourceIndex } from '../../fulltext/SourceIndex';
import Location from './location';
import { exists, isFile } from '../../utils';

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

class SearchContextCollector {
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

class LocationContextCollector {
  constructor(private sourceDirectories: string[], private locations: Location[]) {}

  async collectContext(): Promise<{
    searchResponse: SearchRpc.SearchResponse;
    context: ContextV2.ContextResponse;
  }> {
    const result: { searchResponse: SearchRpc.SearchResponse; context: ContextV2.ContextResponse } =
      { searchResponse: { results: [], numResults: 0 }, context: [] };

    const candidateLocations = new Array<{ location: Location; directory?: string }>();
    for (const location of this.locations) {
      const { path } = location;
      if (isAbsolute(path)) {
        const directory = this.sourceDirectories.find((dir) => path.startsWith(dir));
        candidateLocations.push({ location, directory });
      } else {
        for (const sourceDirectory of this.sourceDirectories) {
          candidateLocations.push({ location, directory: sourceDirectory });
        }
      }
    }

    for (const { location, directory } of candidateLocations) {
      const pathTokens = [directory, location.path].filter(Boolean) as string[];
      const path = join(...pathTokens);
      if (!(await exists(path))) {
        continue;
      }
      if (!(await isFile(path))) {
        warn(`[location-context] Skipping non-file location: ${path}`);
        continue;
      }

      let contents: string | undefined;
      try {
        contents = await readFile(path, 'utf8');
      } catch (e) {
        warn(`[location-context] Failed to read file: ${path}`);
        continue;
      }

      const snippet = location.snippet(contents);
      result.context.push({
        type: ContextV2.ContextItemType.CodeSnippet,
        content: snippet,
        location: location.toString(),
        directory,
      });
    }

    return result;
  }
}

export class ContextCollector {
  public appmaps: string[] | undefined;
  public excludePatterns: RegExp[] | undefined;
  public includePatterns: RegExp[] | undefined;
  public includeTypes: ContextV2.ContextItemType[] | undefined;
  public locations: Location[] | undefined;

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
    const result: { searchResponse: SearchRpc.SearchResponse; context: ContextV2.ContextResponse } =
      { searchResponse: { results: [], numResults: 0 }, context: [] };
    const mergeSearchResults = (searchResult: {
      searchResponse: SearchRpc.SearchResponse;
      context: ContextV2.ContextResponse;
    }) => {
      result.searchResponse.results = result.searchResponse.results.concat(
        searchResult.searchResponse.results
      );
      result.searchResponse.numResults += searchResult.searchResponse.numResults;
      result.context = result.context.concat(searchResult.context);
    };

    if (this.locations && this.locations.length > 0) {
      const locationContextCollector = new LocationContextCollector(
        this.sourceDirectories,
        this.locations
      );
      const locationResult = await locationContextCollector.collectContext();
      mergeSearchResults(locationResult);
    }

    if (this.vectorTerms.length > 0 && this.charLimit > 0) {
      const searchContextCollector = new SearchContextCollector(
        this.appmapDirectories,
        this.sourceDirectories,
        this.appmaps,
        this.vectorTerms,
        this.charLimit
      );
      if (this.includePatterns) searchContextCollector.includePatterns = this.includePatterns;
      if (this.excludePatterns) searchContextCollector.excludePatterns = this.excludePatterns;
      if (this.includeTypes) searchContextCollector.includeTypes = this.includeTypes;

      const searchResult = await searchContextCollector.collectContext();
      mergeSearchResults(searchResult);
    }

    return result;
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
  if (filters?.locations)
    contextCollector.locations = filters.locations
      .map((location) => Location.parse(location))
      .filter(Boolean) as Location[];

  return await contextCollector.collectContext();
}
