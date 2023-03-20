import { AppMapFilter, buildAppMap, deserializeAppmapState } from '@appland/models';

// Simplified AppMap interface, just for pruning
export interface AppMap {
  events: any[];
  [key: string]: any;
}

export const pruneAppMap = (appMap: AppMap, size: number): any => {
  return buildAppMap().source(appMap).prune(size).normalize().build();
};

export const pruneWithFilter = (appMap: AppMap, serializedFilter: string): any => {
  const fullMap = buildAppMap().source(appMap).normalize().build();

  const filterOrState = deserializeAppmapState(serializedFilter);
  const filters = 'filters' in filterOrState ? filterOrState.filters : filterOrState;

  const appmapFilter = new AppMapFilter();
  appmapFilter.declutter.limitRootEvents.on = false;
  appmapFilter.declutter.hideMediaRequests.on = false;
  appmapFilter.apply(filters);
  return appmapFilter.filter(fullMap, []);
};
