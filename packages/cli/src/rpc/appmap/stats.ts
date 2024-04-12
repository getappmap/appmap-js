import { AppMapRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import { processNamedFiles } from '../../utils';
import { readFile } from 'fs/promises';
import configuration, { AppMapConfigWithDirectory } from '../configuration';
import { join } from 'path';

export type Stats = {
  name: string;
  directory: string;
  packages: string[];
  classes: string[];
  routes: string[];
  tables: string[];
  numAppMaps: number;
};

async function getAppmapStats(config: AppMapConfigWithDirectory): Promise<Stats> {
  const packages = new Set<string>();
  const classes = new Set<string>();
  const routes = new Set<string>();
  const tables = new Set<string>();
  let numAppMaps = 0;

  const appmapDir = join(config.directory, config.appmap_dir ?? 'tmp/appmap');
  const collectStrings = (values: Set<string>): ((file: string) => Promise<void>) => {
    return async (file: string): Promise<void> => {
      for (const value of JSON.parse(await readFile(file, 'utf-8'))) values.add(value);
    };
  };

  await processNamedFiles(appmapDir, 'canonical.packages.json', collectStrings(packages));
  await processNamedFiles(appmapDir, 'canonical.classes.json', collectStrings(classes));
  await processNamedFiles(
    appmapDir,
    'canonical.httpServerRequests.json',
    async (file: string): Promise<void> => {
      for (const value of JSON.parse(await readFile(file, 'utf-8'))) routes.add(value.route);
    }
  );
  await processNamedFiles(appmapDir, 'canonical.sqlTables.json', collectStrings(tables));
  await processNamedFiles(appmapDir, 'metadata.json', async () => numAppMaps++);

  return {
    name: config.name || config.directory,
    directory: config.directory,
    packages: Array.from(packages).sort(),
    classes: Array.from(classes).sort(),
    routes: Array.from(routes).sort(),
    tables: Array.from(tables).sort(),
    numAppMaps,
  };
}

export async function collectStats(cachedConfigs?: AppMapConfigWithDirectory[]): Promise<Stats[]> {
  const configs = cachedConfigs ?? (await configuration().configs());
  const stats = await Promise.all(configs.map((config) => getAppmapStats(config)));
  return stats.sort((a, b) => a.name.localeCompare(b.name));
}

export function appmapStatsV1(): RpcHandler<
  AppMapRpc.Stats.V1.Params,
  AppMapRpc.Stats.V1.Response
> {
  return {
    name: ['appmap.stats', AppMapRpc.Stats.V1.Method],
    async handler() {
      const stats = await collectStats();
      return stats.reduce(
        (acc, { packages, classes, routes, tables, numAppMaps }) => {
          acc.packages.push(...packages);
          acc.classes.push(...classes);
          acc.routes.push(...routes);
          acc.tables.push(...new Set(tables));
          acc.numAppMaps += numAppMaps;

          return acc;
        },
        {
          packages: [],
          classes: [],
          routes: [],
          tables: [],
          numAppMaps: 0,
        } as AppMapRpc.Stats.V1.Response
      );
    },
  };
}

export function appmapStatsV2(): RpcHandler<
  AppMapRpc.Stats.V1.Params,
  AppMapRpc.Stats.V2.Response
> {
  return {
    name: AppMapRpc.Stats.V2.Method,
    async handler() {
      const stats = await collectStats();
      return stats.map((stat) => ({
        ...stat,
        directory: undefined,
      }));
    },
  };
}
