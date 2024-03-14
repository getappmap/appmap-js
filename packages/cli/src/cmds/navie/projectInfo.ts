import { ProjectInfo } from '@appland/navie';
import { collectStats } from '../../rpc/appmap/stats';
import configuration from '../../rpc/configuration';

export default async function collectProjectInfos(): Promise<ProjectInfo.ProjectInfo[]> {
  const projectInfoByPath: { [key: string]: ProjectInfo.ProjectInfo } = {};
  const appmapConfigs = await configuration().configs();
  const appmapStats = await collectStats(appmapConfigs);
  appmapStats.forEach((stats) => {
    const { directory } = stats;

    // KG: This is verbose and I don't see the utility of it
    delete (stats as Record<string, unknown>).classes;
    delete (stats as Record<string, unknown>).path;

    projectInfoByPath[directory] = { appmapConfig: undefined, appmapStats: stats };
  });

  appmapConfigs.forEach((config) => {
    projectInfoByPath[config.directory].appmapConfig = {
      name: config.name,
      language: config.language ?? 'unknown',
      appmap_dir: config.appmap_dir ?? 'tmp/appmap',
      packages: config.packages,
    };
  });

  // It's good when results are stable.
  return Object.values(projectInfoByPath).sort((a, b) =>
    (a.appmapConfig?.name || '').localeCompare(b.appmapConfig?.name || '')
  );
}
