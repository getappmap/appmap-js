import { AppMapFilter, buildAppMap } from '@appland/models';

// Simplified AppMap interface, just for pruning
export interface AppMap {
  events: any[];
  [key: string]: any;
}

export const pruneAppMap = (appMap: AppMap, size: number): any => {
  return buildAppMap().source(appMap).prune(size).normalize().build();
};

export const removeEventsByFqid = (appMap: AppMap, fqids: Array<any>): any => {
  const fullMap = buildAppMap().source(appMap).normalize().build();
  const appmapFilter = new AppMapFilter();
  appmapFilter.declutter.hideName.on = true;
  appmapFilter.declutter.hideName.names = fqids;
  return appmapFilter.filter(fullMap, []);
};
