import DependencyMap from './DependencyMap';
import { FindingExample, Report } from './Report';
import collectMetadata from './analyzers/collectMetadata';
import collectHTTPServerRequests from './analyzers/collectHTTPServerRequests';
import collectSQLQueries from './analyzers/collectSQLQueries';
import collectHTTPClientRequests from './analyzers/collectHTTPClientRequests';
import { collectPackageDependencies } from './analyzers/collectPackageDependencies';
import { collectSQLTables } from './analyzers/collectSQLTables';
import { collectLabels } from './analyzers/collectLabels';
import collectRoutes from './analyzers/collectRoutes';
import collectAppMapSize from './analyzers/collectAppMapSize';
import collectFunctionOccurances from './analyzers/collectFunctionOccurances';
import { join } from 'path';
import { warn } from 'console';
import readIndexFile from './readIndexFile';
import collectFindings from './analyzers/collectFindings';
import { EventInfo } from '../stats/accumulateEvents';

export type ReportOptions = {
  frequentFunctionLimit: number;
  largeAppMapLimit: number;
  resourceTokens: number;
};

export async function buildReport(
  appmapDir: string,
  appmaps: string[],
  options: ReportOptions
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
  const findings: FindingExample[] = [];
  const appmapSize: Record<string, number> = {};

  const analyzers: ((appmap: string) => Promise<void>)[] = [
    collectMetadata(appmapCountByRecorderName),
    collectHTTPServerRequests(appmapCountByHTTPServerRequestCount),
    collectSQLQueries(appmapCountBySQLQueryCount),
    collectHTTPClientRequests(clientRouteCountByResource, options.resourceTokens),
    collectPackageDependencies(uniquePackageDependencies),
    collectSQLTables(sqlTables),
    collectLabels(labels),
    collectFindings(findings),
    collectAppMapSize(appmapSize),
  ];

  for (const appmap of appmaps) {
    const metadata = await readIndexFile(appmap, 'metadata.json');
    // If the metadata file is missing, skip this appmap. It's probably been skipped
    // by the indexer because it's too large.
    if (!metadata) continue;

    for (const analyzer of analyzers) {
      try {
        await analyzer(appmap);
      } catch (e) {
        warn(`Error analyzing ${appmap}: ${e}`);
      }
    }
  }

  const uniqueFindings: FindingExample[] = [];
  {
    findings.sort((a, b) => b.modifiedDate.getTime() - a.modifiedDate.getTime());
    const findingHashes = new Set<string>();
    for (const finding of findings) {
      if (!findingHashes.has(finding.hash_v2)) {
        uniqueFindings.push(finding);
        findingHashes.add(finding.hash_v2);
      }
    }
  }

  const largeAppMaps: Record<string, number> = {};
  {
    const appmaps = Object.keys(appmapSize);
    appmaps.sort((a, b) => appmapSize[b] - appmapSize[a]);
    appmaps.slice(0, options.largeAppMapLimit).reduce((acc, appmap) => {
      acc[appmap] = appmapSize[appmap];
      return acc;
    }, largeAppMaps);
  }

  const frequentFunctions: Record<string, EventInfo> = {};
  {
    const functionOccurrances: Record<string, EventInfo> = {};
    {
      const analyzer = collectFunctionOccurances(functionOccurrances);
      for (const appmap of Object.keys(largeAppMaps)) {
        await analyzer(appmap);
      }
    }

    const functions = Object.keys(functionOccurrances);
    functions.sort((a, b) => functionOccurrances[b].count - functionOccurrances[a].count);
    functions.slice(0, options.frequentFunctionLimit).reduce((acc, fn) => {
      acc[fn] = functionOccurrances[fn];
      return acc;
    }, frequentFunctions);
  }

  const openapiFile = join(appmapDir, 'openapi.yml');
  await collectRoutes(
    openapiFile,
    options.resourceTokens,
    routeCountByResource,
    routeCountByContentType
  );

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
    findings: uniqueFindings,
    largeAppMaps,
    frequentFunctions,
  };
}
