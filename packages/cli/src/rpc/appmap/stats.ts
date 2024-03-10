import { AppMapRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import { processNamedFiles } from '../../utils';
import { readFile } from 'fs/promises';
import configuration from '../configuration';

export async function appmapStatsHandler(): Promise<AppMapRpc.StatsResponse> {
  const packages = new Set<string>();
  const classes = new Set<string>();
  const routes = new Set<string>();
  const tables = new Set<string>();
  let numAppMaps = 0;

  const processDirectory = async (appmapDir: string) => {
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
  };

  for (const appmapDir of await configuration().appmapDirs()) await processDirectory(appmapDir);

  return {
    packages: Array.from(packages).sort(),
    classes: Array.from(classes).sort(),
    routes: Array.from(routes).sort(),
    tables: Array.from(tables).sort(),
    numAppMaps,
  };
}

export default function appmapStats(): RpcHandler<AppMapRpc.StatsOptions, AppMapRpc.StatsResponse> {
  return { name: AppMapRpc.StatsFunctionName, handler: () => appmapStatsHandler() };
}
