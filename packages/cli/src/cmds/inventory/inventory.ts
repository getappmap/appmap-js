import yargs from 'yargs';
import { basename, dirname, join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { load } from 'js-yaml';
import { Metadata } from '@appland/models';
import { OpenAPIV3 } from 'openapi-types';

import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { findFiles, verbose } from '../../utils';
import { Dependency, Report } from './Report';
import { Finding, ImpactDomain, ScanResults } from '@appland/scanner';
import { warn } from 'console';
import DependencyMap from './DependencyMap';
import assert from 'assert';
import { locateAppMapDir } from '../../lib/locateAppMapDir';

async function buildRepositoryReport(
  appmapDir: string,
  appmaps: string[],
  resourceTokens: number,
  findingLimit: number
): Promise<Report | undefined> {
  const appmapCountByRecorderName: Record<string, number> = {};
  const appmapCountByHTTPServerRequestCount: Record<string, number> = {};
  const appmapCountBySQLQueryCount: Record<string, number> = {};
  const clientRouteCountByResource: Record<string, number> = {};
  const uniquePackageDependencies = new DependencyMap();
  const uniqueClassDependencies = new DependencyMap();
  const sqlTables = new Set<string>();
  const labels = new Set<string>();
  for (const appmap of appmaps) {
    {
      const metadataFile = join(dirname(appmap), basename(appmap, '.appmap.json'), 'metadata.json');
      const metadata = JSON.parse(await readFile(metadataFile, 'utf-8')) as Metadata;
      const recorderName = metadata.recorder?.name || 'unknown';
      if (!appmapCountByRecorderName[recorderName]) appmapCountByRecorderName[recorderName] = 1;
      else appmapCountByRecorderName[recorderName] = appmapCountByRecorderName[recorderName] + 1;
    }
    {
      const httpServerRequestsFile = join(
        dirname(appmap),
        basename(appmap, '.appmap.json'),
        'canonical.httpServerRequests.json'
      );
      const httpServerRequests = JSON.parse(await readFile(httpServerRequestsFile, 'utf-8'));
      const requestCount = String(httpServerRequests.length);
      if (!appmapCountByHTTPServerRequestCount[requestCount])
        appmapCountByHTTPServerRequestCount[requestCount] = 1;
      else
        appmapCountByHTTPServerRequestCount[requestCount] =
          appmapCountByHTTPServerRequestCount[requestCount] + 1;
    }
    {
      const httpClientRequestsFile = join(
        dirname(appmap),
        basename(appmap, '.appmap.json'),
        'canonical.httpClientRequests.json'
      );
      const httpClientRequests = JSON.parse(await readFile(httpClientRequestsFile, 'utf-8'));
      for (const request of httpClientRequests) {
        const { route } = request;
        const [_method, urlStr] = route.split(' ');
        let hostname: string | undefined, path: string;
        try {
          const url = new URL(urlStr);
          hostname = url.hostname;
          path = url.pathname;
        } catch {
          warn(`Error parsing URL: ${urlStr}`);
          path = urlStr;
        }
        let directoryIsh = path.split('/').slice(0, resourceTokens).join('/');
        if (hostname) directoryIsh = [hostname, directoryIsh].join('');
        if (!clientRouteCountByResource[directoryIsh]) clientRouteCountByResource[directoryIsh] = 1;
        else
          clientRouteCountByResource[directoryIsh] = clientRouteCountByResource[directoryIsh] + 1;
      }
    }
    {
      const labelsFile = join(
        dirname(appmap),
        basename(appmap, '.appmap.json'),
        'canonical.labels.json'
      );
      const labelsArray: string[] = JSON.parse(await readFile(labelsFile, 'utf-8'));
      for (const label of labelsArray) labels.add(label);
    }
    {
      const sqlQueriesFile = join(
        dirname(appmap),
        basename(appmap, '.appmap.json'),
        'canonical.sqlNormalized.json'
      );
      const sqlQueries = JSON.parse(await readFile(sqlQueriesFile, 'utf-8'));
      const sqlQueryCount = String(sqlQueries.length);
      if (!appmapCountBySQLQueryCount[sqlQueryCount]) appmapCountBySQLQueryCount[sqlQueryCount] = 1;
      else
        appmapCountBySQLQueryCount[sqlQueryCount] = appmapCountBySQLQueryCount[sqlQueryCount] + 1;
    }
    {
      const sqlTablesFile = join(
        dirname(appmap),
        basename(appmap, '.appmap.json'),
        'canonical.sqlTables.json'
      );
      const tables: string[] = JSON.parse(await readFile(sqlTablesFile, 'utf-8'));
      for (const table of tables) sqlTables.add(table);
    }
    {
      const packageDependenciesFile = join(
        dirname(appmap),
        basename(appmap, '.appmap.json'),
        'canonical.packageDependencies.json'
      );
      const packageDependencies: Dependency[] = JSON.parse(
        await readFile(packageDependenciesFile, 'utf-8')
      );
      for (const dependency of packageDependencies)
        uniquePackageDependencies.addDependency(dependency);
    }
    {
      const classDependenciesFile = join(
        dirname(appmap),
        basename(appmap, '.appmap.json'),
        'canonical.classDependencies.json'
      );
      const classDependencies: Dependency[] = JSON.parse(
        await readFile(classDependenciesFile, 'utf-8')
      );
      for (const dependency of classDependencies) uniqueClassDependencies.addDependency(dependency);
    }
  }

  const routeCountByResource: Record<string, number> = {};
  const routeCountByContentType: Record<string, number> = {};
  const openapiFile = join(appmapDir, 'openapi.yml');
  if (existsSync(openapiFile)) {
    const openapi: OpenAPIV3.Document = load(
      await readFile(openapiFile, 'utf-8')
    ) as OpenAPIV3.Document;
    for (const pattern of Object.keys(openapi.paths)) {
      const pathItem = openapi.paths[pattern];
      if (!pathItem) continue;

      for (const method of Object.values(OpenAPIV3.HttpMethods)) {
        const operation = pathItem[method];
        if (!operation) continue;

        const route = `${method.toUpperCase()} ${pattern}`;

        const directoryIsh = pattern.split('/').slice(0, resourceTokens).join('/');
        if (!routeCountByResource[directoryIsh]) routeCountByResource[directoryIsh] = 1;
        else routeCountByResource[directoryIsh] = routeCountByResource[directoryIsh] + 1;

        for (const responseOption of Object.values(operation.responses)) {
          const response = responseOption as OpenAPIV3.ResponseObject;
          if (response.content) {
            for (const contentType of Object.keys(response.content)) {
              if (!routeCountByContentType[contentType]) routeCountByContentType[contentType] = 1;
              else routeCountByContentType[contentType] = routeCountByContentType[contentType] + 1;
            }
          }
        }
      }
    }
  }

  const findingsFiles = await findFiles(appmapDir, 'appmap-findings.json');
  const findingCountByImpactDomain: Record<string, number> = {};
  // Collect up to `findingLimit` findings for each impact domain
  const findingExamples = new Map<ImpactDomain, Finding[]>();
  {
    const countFinding = (finding: Finding): void => {
      const impactDomain = finding.impactDomain || 'Unknown';

      if (!findingCountByImpactDomain[impactDomain]) findingCountByImpactDomain[impactDomain] = 1;
      else findingCountByImpactDomain[impactDomain] = findingCountByImpactDomain[impactDomain] + 1;
    };

    const collectFindingExample = (finding: Finding): void => {
      const impactDomain = finding.impactDomain;
      if (!impactDomain) return;

      if (!findingExamples.has(impactDomain)) findingExamples.set(impactDomain, [] as Finding[]);
      const findings = findingExamples.get(impactDomain);
      assert(findings);
      if (findings.length < findingLimit) {
        findings.push(finding);
      }
    };

    for (const findingsFile of findingsFiles) {
      const scanResults = JSON.parse(await readFile(findingsFile, 'utf-8')) as ScanResults;
      for (const finding of scanResults.findings) {
        countFinding(finding);
        collectFindingExample(finding);
      }
    }
  }

  const findings = new Array<Finding>();
  {
    const impactDomainPriority = (impactDomain?: ImpactDomain): number => {
      switch (impactDomain) {
        case 'Security':
          return 0;
        case 'Performance':
          return 1;
        case 'Stability':
          return 3;
        case 'Maintainability':
          return 4;
        default:
          return 5;
      }
    };

    {
      let impactDomains = [...findingExamples.keys()]
        .filter((impactDomain) => findingExamples.get(impactDomain)?.length)
        .sort((a, b) => impactDomainPriority(a) - impactDomainPriority(b));

      let impactDomainIndex = 0;
      const nextFinding = (): Finding => {
        assert(impactDomains.length > 0);
        const impactDomain = impactDomains[impactDomainIndex];
        const findingsForDomain = findingExamples.get(impactDomain);
        assert(findingsForDomain);
        const finding = findingsForDomain.shift();
        assert(finding);

        if (findingsForDomain.length === 0) impactDomains.splice(impactDomainIndex, 1);
        else impactDomainIndex = impactDomainIndex + 1;
        impactDomainIndex = impactDomainIndex % impactDomains.length;

        return finding;
      };

      let finding: Finding;
      while ((finding = nextFinding())) {
        findings.push(finding);

        if (findings.length === findingLimit) break;
        if (impactDomains.length === 0) break;
      }
    }

    findings.sort(
      (a, b) => impactDomainPriority(a.impactDomain) - impactDomainPriority(b.impactDomain)
    );
  }

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
    findingCountByImpactDomain,
    findings,
  };
}

export const command = 'inventory [output-file]';
export const describe = 'Generate a JSON report describing the contents of a repository.';

export const builder = (args: yargs.Argv) => {
  args.positional('output-file', {
    type: 'string',
    describe: `output file to write the JSON report. If this option is not provided, the report is written to stdout`,
    demandOption: false,
  });

  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });

  args.option('appmap-dir', {
    describe: 'directory to recursively inspect for AppMaps',
  });

  args.option('resource-tokens', {
    describe: `number of path tokens to include in the 'by resource' output`,
    type: 'number',
    default: 2,
  });

  args.option('finding-limit', {
    describe: `number of sample findings to include in the report`,
    type: 'number',
    default: 10,
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);

  const { outputFile, directory, resourceTokens, findingLimit } = argv;
  assert(resourceTokens);
  assert(typeof resourceTokens === 'number');
  assert(resourceTokens > 0);

  handleWorkingDirectory(directory);
  if (!outputFile) {
    warn(`No output file specified. Report JSON will be written to stdout.`);
  }

  const appmapDir = await locateAppMapDir(argv.appmapDir);

  if (!existsSync(join(appmapDir, 'appmap_archive.json'))) {
    warn(`No appmap_archive.json found in ${appmapDir}`);
    warn(`Run 'appmap archive' to index and analyze the AppMaps, then run this command again`);
    yargs.exit(1, new Error('No appmap_archive.json found'));
  }

  const appmaps = await findFiles(appmapDir, '.appmap.json');
  if (appmaps.length === 0) {
    warn(`No AppMaps found in ${appmapDir}`);
    return;
  }

  warn(`Building repository report from ${appmaps.length} AppMaps in ${appmapDir}`);

  const report = await buildRepositoryReport(
    appmapDir,
    appmaps,
    resourceTokens + 1 /* The url '/' is actually 2 tokens, so add 1 to the user input */,
    findingLimit
  );

  const reportJSONStr = JSON.stringify(report, null, 2);
  if (outputFile) {
    await writeFile(outputFile, reportJSONStr);
  } else {
    console.log(reportJSONStr);
  }
};
