export type Dependency = {
  caller: string;
  callee: string;
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
  findingCountByImpactDomain: Record<string, number>;
};
