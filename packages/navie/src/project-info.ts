export type ProjectInfoRequest = {
  type: 'projectInfo';
  includeDiff?: boolean;
  baseBranch?: string;
};

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

export type CodeEditorInfo = {
  name: string;
};

export type ProjectInfo = {
  directory: string;
  appmapConfig?: AppMapConfig;
  appmapStats?: AppMapStats;
  codeEditor?: CodeEditorInfo;
  diff?: string;
};

export type ProjectInfoResponse = ProjectInfo | Array<ProjectInfo>;

export type ProjectInfoProvider = (
  request: ProjectInfoRequest
) => Promise<ProjectInfoResponse | undefined>;
