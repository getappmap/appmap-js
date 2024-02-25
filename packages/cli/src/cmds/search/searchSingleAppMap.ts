import { AppMapFilter } from '@appland/models';
import FindEvents, { SearchOptions, SearchResponse } from '../../fulltext/FindEvents';

export type SearchSingleMapOptions = {
  maxSize?: number;
  maxResults?: number;
  threshold?: number;
  filter?: AppMapFilter;
};

export default async function searchSingleAppMap(
  appmap: string,
  query: string,
  options: SearchSingleMapOptions = {}
): Promise<SearchResponse> {
  if (appmap.endsWith('.appmap.json')) appmap = appmap.slice(0, -'.appmap.json'.length);

  const findEvents = new FindEvents(appmap);
  if (options.maxSize) findEvents.maxSize = options.maxSize;
  if (options.filter) findEvents.filter = options.filter;
  await findEvents.initialize();
  return findEvents.search(query, new SearchOptions(options.maxResults, options.threshold));
}
