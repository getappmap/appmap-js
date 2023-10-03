export type Dependency = {
  caller: string;
  callee: string;
};

export type Report = {
  appmapCountByRecorderName: Record<string, number>;
  appmapCountByHTTPServerRequestCount: Record<string, number>;
  appmapCountBySQLQueryCount: Record<string, number>;
  routeCountByResource: Record<string, number>;
  routeCountByContentType: Record<string, number>;
  clientRouteCountByResource: Record<string, number>;
  sqlTables: string[];
  labels: string[];
  packages: string[];
  packageDependencies: Dependency[];
  findingCountByImpactDomain: Record<string, number>;
};
