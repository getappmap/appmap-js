import { AppMapRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import { processNamedFiles } from '../../utils';
import { readFile } from 'fs/promises';

export async function appmapStatsHandler(appmapDir: string): Promise<AppMapRpc.StatsResponse> {
  const packages = new Set<string>();
  const classes = new Set<string>();
  const routes = new Set<string>();
  const tables = new Set<string>();

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
  let numAppMaps = 0;
  await processNamedFiles(appmapDir, 'metadata.json', async () => numAppMaps++);

  return {
    packages: Array.from(packages).sort(),
    classes: Array.from(classes).sort(),
    routes: Array.from(routes).sort(),
    tables: Array.from(tables).sort(),
    numAppMaps,
  };
}

export default function appmapStats(
  appmapDir: string
): RpcHandler<AppMapRpc.StatsOptions, AppMapRpc.StatsResponse> {
  return { name: AppMapRpc.StatsFunctionName, handler: () => appmapStatsHandler(appmapDir) };
}
