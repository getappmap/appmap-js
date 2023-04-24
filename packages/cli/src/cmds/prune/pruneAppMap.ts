import { buildAppMap } from '@appland/models';
import deserializeFilter from '../../lib/deserializeFilter';

// Simplified AppMap interface, just for pruning
export interface AppMap {
  events: any[];
  [key: string]: any;
}

export type PruneFilter = {
  hideUnlabeled?: boolean;
  hideMediaRequests?: boolean;
  hideExternalPaths?: boolean;
  hideElapsedTimeUnder?: string;
  hideName?: Array<string>;
};

function combinePruneFilters(oldFilter: PruneFilter, currentFilter: PruneFilter): PruneFilter {
  const newFilter = currentFilter;

  if (oldFilter.hideUnlabeled)
    newFilter.hideUnlabeled = oldFilter.hideUnlabeled || currentFilter.hideUnlabeled;

  if (oldFilter.hideMediaRequests)
    newFilter.hideMediaRequests = oldFilter.hideMediaRequests || currentFilter.hideMediaRequests;

  if (oldFilter.hideExternalPaths)
    newFilter.hideExternalPaths = oldFilter.hideExternalPaths || currentFilter.hideExternalPaths;

  if (oldFilter.hideElapsedTimeUnder) {
    if (currentFilter.hideElapsedTimeUnder) {
      const oldValue = Number(oldFilter.hideElapsedTimeUnder);
      const currentValue = Number(currentFilter.hideElapsedTimeUnder);
      const newValue = oldValue > currentValue ? oldValue : currentValue;
      newFilter.hideElapsedTimeUnder = String(newValue);
    } else {
      newFilter.hideElapsedTimeUnder = oldFilter.hideElapsedTimeUnder;
    }
  }

  if (oldFilter.hideName) {
    if (currentFilter.hideName) {
      const oldValue = oldFilter.hideName;
      const currentValue = currentFilter.hideName;

      newFilter.hideName = oldValue.reduce((result, nameToHide) => {
        if (!currentValue.includes(nameToHide)) currentValue.push(nameToHide);
        return result;
      }, currentValue);
    } else {
      newFilter.hideName = oldFilter.hideName;
    }
  }

  return newFilter;
}

export const pruneAppMap = (appMap: AppMap, size: number): any => {
  return buildAppMap().source(appMap).prune(size).normalize().build();
};

export const pruneWithFilter = (appMap: AppMap, serializedFilter: string): any => {
  // TODO: update type for AppMap
  const fullMap = buildAppMap().source(appMap).normalize().build() as any;

  const filterBefore = fullMap.data.pruneFilter || {};
  // Note: Preserving the default of these two options to false, even though I am not sure why
  // that is done in the original implementation.
  const { filter, appmapFilter } = deserializeFilter(serializedFilter, false, false);

  // TODO: update type for AppMap
  const prunedMap = appmapFilter.filter(fullMap, []) as any;
  const pruneFilter = combinePruneFilters(filterBefore, filter);
  prunedMap.data = { ...prunedMap.data, pruneFilter };
  return prunedMap;
};
