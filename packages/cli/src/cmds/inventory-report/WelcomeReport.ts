import { AppMapConfig } from '../../lib/loadAppMapConfig';
import { Dependency, FindingExample, FunctionInfo } from '../inventory/Report';

export type AppMapInfo = {
  name: string;
  sourceLocation?: string;
  size: number;
};

export type WelcomeReport = {
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
  largeAppMaps: Record<string, AppMapInfo>;
  frequentFunctions: Record<string, FunctionInfo>;
  appmapConfig: AppMapConfig;
};
