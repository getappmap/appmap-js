export type ProjectInfoRequest = {};

export type ProjectInfoResponse = {
  'appmap.yml': any;
  appmapStats: any;
};

export type ProjectInfoProvider = (
  request: ProjectInfoRequest
) => Promise<ProjectInfoResponse | undefined>;
