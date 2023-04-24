import {
  AppMapFilter,
  buildAppMap,
  deserializeFilter,
  filterStringToFilterState,
  mergeFilterState,
  serializeFilter,
} from '@appland/models';

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
  const previousFilterState = fullMap.data.pruneFilter;

  let previousFilter: AppMapFilter | undefined;
  if (previousFilterState) previousFilter = deserializeFilter(previousFilterState);

  let filterState = filterStringToFilterState(serializedFilter);
  if (previousFilterState) filterState = mergeFilterState(filterState, previousFilterState);

  const appmapFilter = deserializeFilter(filterState);

  // TODO: update type for AppMap
  const prunedMap = appmapFilter.filter(fullMap, []) as any;
  prunedMap.data = { ...prunedMap.data, pruneFilter: serializeFilter(appmapFilter) };
  return prunedMap;
};
