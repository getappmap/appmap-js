export type Dependency = {
  caller: string;
  callee: string;
};

export type FindingExample = {
  appmap: string;
  modifiedDate: Date;
  hash_v2: string;
  impactDomain?: string;
};

export type FunctionInfo = {
  count: number;
  size: number;
  location: string;
};

export type Report = {
  appmapCountByRecorderName: Record<string, number>;
  appmapCountByHTTPServerRequestCount: Record<number, number>;
  routeCountByResource: Record<string, number>;
  routeCountByContentType: Record<string, number>;
  appmapCountBySQLQueryCount: Record<number, number>;
  sqlTables: string[];
  clientRouteCountByResource: Record<string, number>;
  labels: string[];
  packages: string[];
  packageDependencies: Dependency[];
  findings: FindingExample[];
  largeAppMaps: Record<string, number>;
  frequentFunctions: Record<string, FunctionInfo>;
};
