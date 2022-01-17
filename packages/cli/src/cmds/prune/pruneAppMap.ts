import { buildAppMap } from '@appland/models';

// Simplified AppMap interface, just for pruning
export interface AppMap {
  events: any[],
  [key: string]: any
};

export const pruneAppMap = (appMap: AppMap, size: number): any => {
  return buildAppMap()
    .source(appMap)
    .prune(size)
    .normalize()
    .build();
};
