import DependencyMap from './DependencyMap';
import { Report } from './Report';
import collectMetadata from './analyzers/collectMetadata';
import collectHTTPServerRequests from './analyzers/collectHTTPServerRequests';
import collectSQLQueries from './analyzers/collectSQLQueries';
import collectHTTPClientRequests from './analyzers/collectHTTPClientRequests';
import { collectPackageDependencies } from './analyzers/collectPackageDependencies';
import { collectClassDependencies } from './analyzers/collectClassDependencies';
import { collectSQLTables } from './analyzers/collectSQLTables';
import { collectLabels } from './analyzers/collectLabels';
import collectRoutes from './analyzers/collectRoutes';
import { join } from 'path';

export async function buildReport(
  appmapDir: string,
  appmaps: string[],
  resourceTokens: number
): Promise<Report> {
  const appmapCountByRecorderName: Record<string, number> = {};
  const appmapCountByHTTPServerRequestCount: Record<string, number> = {};
  const appmapCountBySQLQueryCount: Record<string, number> = {};
  const clientRouteCountByResource: Record<string, number> = {};
  const uniquePackageDependencies = new DependencyMap();
  const sqlTables = new Set<string>();
  const labels = new Set<string>();
  const routeCountByResource: Record<string, number> = {};
  const routeCountByContentType: Record<string, number> = {};

  const analyzers: ((appmap: string) => Promise<void>)[] = [
    collectMetadata(appmapCountByRecorderName),
    collectHTTPServerRequests(appmapCountByHTTPServerRequestCount),
    collectSQLQueries(appmapCountBySQLQueryCount),
    collectHTTPClientRequests(clientRouteCountByResource, resourceTokens),
    collectPackageDependencies(uniquePackageDependencies),
    collectSQLTables(sqlTables),
    collectLabels(labels),
  ];

  for (const appmap of appmaps) {
    for (const analyzer of analyzers) {
      await analyzer(appmap);
    }
  }

  const openapiFile = join(appmapDir, 'openapi.yml');
  await collectRoutes(openapiFile, resourceTokens, routeCountByResource, routeCountByContentType);

  return {
    appmapCountByRecorderName,
    appmapCountByHTTPServerRequestCount,
    appmapCountBySQLQueryCount,
    routeCountByResource,
    routeCountByContentType,
    clientRouteCountByResource,
    labels: [...labels].sort(),
    sqlTables: [...sqlTables].sort(),
    packages: [
      ...new Set(uniquePackageDependencies.dependencies.map((d) => [d.caller, d.callee]).flat()),
    ].sort(),
    packageDependencies: uniquePackageDependencies.dependencies,
  };
}
