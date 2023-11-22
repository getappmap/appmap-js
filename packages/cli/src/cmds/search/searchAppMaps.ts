import FindAppMaps, { SearchResponse } from '../../fulltext/FindAppMaps';

export type SearchOptions = {
  maxResults?: number;
};

export default async function searchAppMaps(
  appmapDir: string,
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  const findAppMaps = new FindAppMaps(appmapDir);
  await findAppMaps.initialize();
  return findAppMaps.search(query, { maxResults: options.maxResults });
}
