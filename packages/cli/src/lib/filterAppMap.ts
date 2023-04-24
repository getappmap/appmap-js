import { AppMap } from '@appland/models';
import deserializeFilter from './deserializeFilter';

export default function filterAppMap(appMap: AppMap, serializedFilter: string): AppMap {
  const { appmapFilter } = deserializeFilter(serializedFilter);
  return appmapFilter.filter(appMap, []);
}
