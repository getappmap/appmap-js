import {
  AppMapFilter,
  FilterState,
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

export type PruneResult = { appmap: AppMap; filter?: AppMapFilter };

export const pruneAppMap = (appMap: AppMap, size: number): PruneResult => {
  // I'm not sure what the purpose of the local AppMap interface is, but I'll maintain it for now.
  const appmap = buildAppMap().source(appMap).prune(size).normalize().build() as any as AppMap;
  return { appmap };
};

// Deserializes an untrusted serialized filter (the CLI accepts it as a
// base64url-encoded string) into an AppMapFilter and applies it to the map.
// Labeled so appmap-review interprets changes to this deserialization boundary.
// @label security.deserialization
export const pruneWithFilter = (appMap: AppMap, serializedFilter: string): PruneResult => {
  // TODO: update type for AppMap
  const fullMap = buildAppMap().source(appMap).normalize().build() as any;
  const previousFilterState = fullMap.data.pruneFilter;

  let previousFilter: AppMapFilter | undefined;
  if (previousFilterState) previousFilter = deserializeFilter(previousFilterState);

  let filterState = filterStringToFilterState(serializedFilter);
  if (previousFilterState) filterState = mergeFilterState(filterState, previousFilterState);

  const appmapFilter = deserializeFilter(filterState);

  const prunedMap = appmapFilter.filter(fullMap, []) as any as AppMap;
  prunedMap.data = { ...prunedMap.data, pruneFilter: serializeFilter(appmapFilter) };
  return { appmap: prunedMap, filter: appmapFilter };
};
