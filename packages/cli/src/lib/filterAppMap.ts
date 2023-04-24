import { AppMap, deserializeFilter, filterStringToFilterState } from '@appland/models';

export default function filterAppMap(appMap: AppMap, serializedFilter: string): AppMap {
  const appmapFilter = deserializeFilter(filterStringToFilterState(serializedFilter));
  return appmapFilter.filter(appMap, []);
}
