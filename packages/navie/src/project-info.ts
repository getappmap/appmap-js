export type ProjectInfoRequest = {};

export type AppMapConfig = {
  name: string;
  language: string;
  appmap_dir: string;
  packages: any;
};

export type AppMapStats = {
  packages: string[];
  routes: string[];
  tables: string[];
  numAppMaps: number;
};

export type ProjectInfoResponse = {
  appmapConfig: AppMapConfig;
  appmapStats: AppMapStats;
};

export type ProjectInfoProvider = (
  request: ProjectInfoRequest
) => Promise<ProjectInfoResponse | undefined>;
