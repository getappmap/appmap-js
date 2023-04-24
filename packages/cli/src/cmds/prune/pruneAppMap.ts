import { buildAppMap, deserializeFilter, filterStringToFilterState } from '@appland/models';

// Simplified AppMap interface, just for pruning
export interface AppMap {
  events: any[];
  [key: string]: any;
}

export const pruneAppMap = (appMap: AppMap, size: number): any => {
  return buildAppMap().source(appMap).prune(size).normalize().build();
};

export const pruneWithFilter = (appMap: AppMap, serializedFilter: string): any => {
  // TODO: update type for AppMap
  const fullMap = buildAppMap().source(appMap).normalize().build() as any;

  const appmapFilter = deserializeFilter(filterStringToFilterState(serializedFilter));

  // TODO: update type for AppMap
  const prunedMap = appmapFilter.filter(fullMap, []) as any;
  prunedMap.data = { ...prunedMap.data, filter: appmapFilter };
  return prunedMap;
};
