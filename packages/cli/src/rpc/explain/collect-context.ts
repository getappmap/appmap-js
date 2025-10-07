import { ContextV2 } from '@appland/navie';
import { SearchRpc } from '@appland/rpc';
import { queryKeywords } from '@appland/search';

import { SearchResult as EventSearchResult } from '../../fulltext/FindEvents';
import Location from './location';
import { warn } from 'console';
import collectLocationContext from './collect-location-context';
import collectSearchContext from './collect-search-context';

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

export type ContextRequest = {
  appmaps?: string[];
  excludePatterns?: RegExp[];
  includePatterns?: RegExp[];
  includeTypes?: ContextV2.ContextItemType[];
  locations?: Location[];
};

export function buildContextRequest(
  appmapDirectories: string[],
  sourceDirectories: string[],
  appmaps: string[] | undefined,
  searchTerms: string[],
  charLimit: number,
  filters: ContextV2.ContextFilters
): { vectorTerms: string[]; request: ContextRequest } {
  const vectorTerms = searchTerms
    .map((term) => queryKeywords(term))
    .flat()
    .map((t) => t.trim())
    .filter(Boolean);

  const request: ContextRequest = {};

  // Use a set to deduplicate location patterns in case the model requests the
  // same file multiple times, which can lead to long wait times and context stuffing.
  const locations = filters.locations ? new Set(filters.locations) : undefined;

  const contextParameters: Record<string, string | number | boolean> = {
    sourceDirectories: sourceDirectories.join(', '),
    charLimit,
  };
  if (appmapDirectories.length > 0)
    contextParameters.appmapDirectories = appmapDirectories.join(', ');
  if (vectorTerms.length > 0) contextParameters.keywords = vectorTerms.join(', ');
  if (appmaps && appmaps.length > 0) contextParameters.appmaps = appmaps.join(', ');
  if (filters.recent) contextParameters.recent = filters.recent;
  if (locations) contextParameters.locations = Array.from(locations).join(', ');
  if (filters.itemTypes) contextParameters.itemTypes = filters.itemTypes.join(', ');
  if (filters.labels && filters.labels.length > 0)
    contextParameters.labels = filters.labels
      .map((label) => `${label.name}(${label.weight})`)
      .join(', ');
  if (filters.exclude) contextParameters.exclude = filters.exclude.join(', ');
  if (filters.include) contextParameters.include = filters.include.join(', ');

  if (appmaps) request.appmaps = appmaps;

  const contextDebugString = Object.entries(contextParameters)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
  warn(`Collecting context with parameters: ${contextDebugString}`);

  const excludePatterns: RegExp[] = [];
  if (filters?.exclude)
    excludePatterns.push(...filters.exclude.map((pattern) => new RegExp(pattern)));
  if (filters?.include)
    request.includePatterns = filters.include.map((pattern) => new RegExp(pattern));
  if (filters?.itemTypes) request.includeTypes = filters.itemTypes.map((type) => type);
  if (locations) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    request.locations = Array.from(locations).map(Location.parse);
    warn(`Parsed locations: ${request.locations.map((loc) => loc.toString()).join(', ')}`);
  }

  const appendIfNotExists = (patterns: RegExp[], pattern: RegExp): RegExp[] => {
    if (!patterns.find((p) => p.source === pattern.source)) patterns.push(pattern);
    return patterns;
  };

  for (const dir of EXCLUDE_DIRS) appendIfNotExists(excludePatterns, buildExclusionPattern(dir));

  request.excludePatterns = excludePatterns;

  return { vectorTerms, request };
}

export default async function collectContext(
  appmapDirectories: string[],
  sourceDirectories: string[],
  charLimit: number,
  vectorTerms: string[],
  request: ContextRequest,
  explicitFiles: string[] = []
): Promise<{ searchResponse: SearchRpc.SearchResponse; context: ContextV2.ContextResponse }> {
  let searchResponse: SearchRpc.SearchResponse = { results: [], numResults: 0 };
  const context: ContextV2.ContextResponse = [];

  if (request.locations && request.locations.length > 0) {
    const locationResult = await collectLocationContext(
      sourceDirectories,
      request.locations,
      explicitFiles
    );
    context.push(...locationResult);
  }

  if (vectorTerms.length > 0 && charLimit > 0) {
    const searchResult = await collectSearchContext(
      appmapDirectories,
      sourceDirectories,
      vectorTerms,
      charLimit,
      request
    );

    searchResponse = searchResult.searchResponse;
    context.push(...searchResult.context);
  }

  return { searchResponse, context };
}
