import { ProjectInfo } from '@appland/navie';
import { appmapStatsHandler } from '../../rpc/appmap/stats';
import configuration from '../../rpc/configuration';

export default async function collectProjectInfos(): Promise<ProjectInfo.ProjectInfo[]> {
  const projectInfoByPath: { [key: string]: ProjectInfo.ProjectInfo } = {};
  // KEG: I'm not sure the point of this, since the appmapStatsHandler will also check the configuration.
  const appmapConfigs = await configuration().configs();
  const appmapStats = await appmapStatsHandler(appmapConfigs);
  appmapStats.forEach((stats) => {
    const path = stats.path;

    // KG: This is verbose and I don't see the utility of it
    delete (stats as Record<string, unknown>).classes;
    delete (stats as Record<string, unknown>).path;

    projectInfoByPath[path] = { appmapConfig: undefined, appmapStats: stats };
  });

  appmapConfigs.forEach((config) => {
    projectInfoByPath[config.path].appmapConfig = {
      name: config.name,
      language: config.language ?? 'unknown',
      appmap_dir: config.appmap_dir ?? 'tmp/appmap',
      packages: config.packages,
    };
  });

  // It's good when results are stable.
  return Object.values(projectInfoByPath).sort((a, b) => (a.appmapConfig?.name || '').localeCompare(b.appmapConfig?.name || ''));
}
