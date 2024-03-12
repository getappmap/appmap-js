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

export type ProjectInfoV1 = ProjectInfo;
export type ProjectInfoV2 = { [key: string]: ProjectInfo };
export type ProjectInfoResponse = ProjectInfoV1 | ProjectInfoV2;

export type ProjectInfoProvider = (
  request: ProjectInfoRequest
) => Promise<ProjectInfoResponse | undefined>;

export function isV2ProjectInfoResponse(
  projectInfo: ProjectInfoResponse
): projectInfo is ProjectInfoV2 {
  return Object.values(projectInfo).every((info) => 'appmapStats' in info);
}

export function toV2ProjectInfoResponse(projectInfo: ProjectInfoResponse): ProjectInfoV2 {
  if (isV2ProjectInfoResponse(projectInfo)) {
    return projectInfo;
  }

  return { project: projectInfo };
}
