import { AppMapRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import { processNamedFiles } from '../../utils';
import { readFile } from 'fs/promises';
import configuration, { AppMapConfigWithPath } from '../configuration';
import { join } from 'path';

// Path is included for name disambiguation
type Stats = AppMapRpc.Stats & { name: string; path: string };

async function getAppmapStats(config: AppMapConfigWithPath): Promise<Stats> {
  const packages = new Set<string>();
  const classes = new Set<string>();
  const routes = new Set<string>();
  const tables = new Set<string>();
  let numAppMaps = 0;

  const appmapDir = join(config.path, config.appmap_dir ?? 'tmp/appmap');
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
    name: config.name,
    path: config.path,
    packages: Array.from(packages).sort(),
    classes: Array.from(classes).sort(),
    routes: Array.from(routes).sort(),
    tables: Array.from(tables).sort(),
    numAppMaps,
  };
}

export async function appmapStatsHandler(cachedConfigs?: AppMapConfigWithPath[]): Promise<Stats[]> {
  const configs = cachedConfigs ?? (await configuration().configs());
  const stats = await Promise.all(configs.map((config) => getAppmapStats(config)));
  return stats.sort((a, b) => a.name.localeCompare(b.name));
}

export default function appmapStats(): RpcHandler<AppMapRpc.StatsOptions, AppMapRpc.StatsResponse> {
  return { name: AppMapRpc.StatsFunctionName, handler: () => appmapStatsHandler() };
}
