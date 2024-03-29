export type ProjectInfoRequest = { [key: string]: unknown };

export type AppMapConfig = {
  name: string;
  language: string;
  appmap_dir: string;
  packages: unknown;
};

export type AppMapStats = {
  packages: string[];
  routes: string[];
  tables: string[];
  numAppMaps: number;
};

export type ProjectInfo = {
  appmapConfig?: AppMapConfig;
  appmapStats: AppMapStats;
};

export type ProjectInfoResponse = ProjectInfo | Array<ProjectInfo>;

export type ProjectInfoProvider = (
  request: ProjectInfoRequest
) => Promise<ProjectInfoResponse | undefined>;
