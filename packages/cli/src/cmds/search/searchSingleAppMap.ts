import { AppMapFilter } from '@appland/models';
import FindEvents, { SearchResponse } from '../../fulltext/FindEvents';

export type SearchOptions = {
  maxSize?: number;
  maxResults?: number;
  filter?: AppMapFilter;
};

export default async function searchSingleAppMap(
  appmap: string,
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  // eslint-disable-next-line no-param-reassign
  if (appmap.endsWith('.appmap.json')) appmap = appmap.slice(0, -'.appmap.json'.length);

  const findEvents = new FindEvents(appmap);
  if (options.maxSize) findEvents.maxSize = options.maxSize;
  if (options.filter) findEvents.filter = options.filter;
  await findEvents.initialize();
  return findEvents.search(query, { maxResults: options.maxResults });
}
