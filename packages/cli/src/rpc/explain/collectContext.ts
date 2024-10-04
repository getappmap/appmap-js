import { ContextV2 } from '@appland/navie';
import { SearchRpc } from '@appland/rpc';

import { SearchResult as EventSearchResult } from '../../fulltext/FindEvents';
import Location from './location';
import SearchContextCollector from './SearchContextCollector';
import LocationContextCollector from './LocationContextCollector';
import queryKeywords from '../../fulltext/queryKeywords';
import { warn } from 'console';

export const buildExclusionPattern = (dirName: string): RegExp => {
  const dirNamePattern = dirName.replace('.', '\\.');
  return new RegExp(`(^|[/\\\\])${dirNamePattern}([/\\\\]|$)`);
};

const EXCLUDE_DIRS = ['.appmap', '.navie', '.yarn', 'venv', '.venv', 'node_modules', 'vendor'];

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

export const CHARS_PER_SNIPPET = 50;

export class ContextCollector {
  public appmaps: string[] | undefined;
  public excludePatterns: RegExp[] | undefined;
  public includePatterns: RegExp[] | undefined;
  public includeTypes: ContextV2.ContextItemType[] | undefined;
  public locations: Location[] | undefined;

  query: string;
  vectorTerms: string[];

  constructor(
    private appmapDirectories: string[],
    private sourceDirectories: string[],
    vectorTerms: string[],
    private charLimit: number
  ) {
    this.vectorTerms = vectorTerms.map((term) => term.trim()).filter(Boolean);
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
  searchTerms: string[],
  charLimit: number,
  filters: ContextV2.ContextFilters
): Promise<{
  searchResponse: SearchRpc.SearchResponse;
  context: ContextV2.ContextResponse;
}> {
  const keywords = searchTerms.map((term) => queryKeywords(term)).flat();

  //   recent?: boolean;
  // locations?: string[];
  // itemTypes?: ContextItemType[];
  // labels?: ContextLabel[];
  // exclude?: string[];
  // include?: string[];

  const contextParameters: Record<string, string | number | boolean> = {
    sourceDirectories: sourceDirectories.join(', '),
    charLimit,
  };
  if (appmapDirectories.length > 0)
    contextParameters.appmapDirectories = appmapDirectories.join(', ');
  if (keywords.length > 0) contextParameters.keywords = keywords.join(', ');
  if (appmaps && appmaps.length > 0) contextParameters.appmaps = appmaps.join(', ');
  if (filters.recent) contextParameters.recent = filters.recent;
  if (filters.locations) contextParameters.locations = filters.locations.join(', ');
  if (filters.itemTypes) contextParameters.itemTypes = filters.itemTypes.join(', ');
  if (filters.labels && filters.labels.length > 0)
    contextParameters.labels = filters.labels
      .map((label) => `${label.name}(${label.weight})`)
      .join(', ');
  if (filters.exclude) contextParameters.exclude = filters.exclude.join(', ');
  if (filters.include) contextParameters.include = filters.include.join(', ');

  const contextDebugString = Object.entries(contextParameters)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
  warn(`Collecting context with parameters: ${contextDebugString}`);

  const contextCollector = new ContextCollector(
    appmapDirectories,
    sourceDirectories,
    keywords,
    charLimit
  );
  if (appmaps) contextCollector.appmaps = appmaps;

  const excludePatterns: RegExp[] = [];
  if (filters?.exclude)
    excludePatterns.push(...filters.exclude.map((pattern) => new RegExp(pattern)));
  if (filters?.include)
    contextCollector.includePatterns = filters.include.map((pattern) => new RegExp(pattern));
  if (filters?.itemTypes) contextCollector.includeTypes = filters.itemTypes.map((type) => type);
  if (filters?.locations) {
    contextCollector.locations = filters.locations
      .map((location) => Location.parse(location))
      .filter(Boolean) as Location[];
    warn(`Parsed locations: ${contextCollector.locations.map((loc) => loc.toString()).join(', ')}`);
  }

  const appendIfNotExists = (patterns: RegExp[], pattern: RegExp): RegExp[] => {
    if (!patterns.find((p) => p.source === pattern.source)) patterns.push(pattern);
    return patterns;
  };

  for (const dir of EXCLUDE_DIRS) appendIfNotExists(excludePatterns, buildExclusionPattern(dir));

  contextCollector.excludePatterns = excludePatterns;

  return await contextCollector.collectContext();
}
