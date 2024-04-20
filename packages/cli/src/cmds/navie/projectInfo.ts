import { ProjectInfo } from '@appland/navie';
import { collectStats } from '../../rpc/appmap/stats';
import configuration from '../../rpc/configuration';

export default async function collectProjectInfos(): Promise<ProjectInfo.ProjectInfo[]> {
  const projectInfoByPath: Record<string, ProjectInfo.ProjectInfo> = {};
  const appmapDirectories = await configuration().appmapDirectories();
  const appmapStats = await collectStats(appmapDirectories);
  appmapStats.forEach((stats) => {
    const { directory } = stats;

    // KG: This is verbose and I don't see the utility of it
    delete (stats as Record<string, unknown>).classes;
    delete (stats as Record<string, unknown>).path;

    projectInfoByPath[directory] = { appmapConfig: undefined, appmapStats: stats };
  });

  appmapDirectories.forEach((dir) => {
    projectInfoByPath[dir.directory].appmapConfig = {
      name: dir.appmapConfig.name,
      language: dir.appmapConfig.language ?? 'unknown',
      appmap_dir: dir.appmapConfig.appmap_dir ?? 'tmp/appmap',
      packages: dir.appmapConfig.packages,
    };
  });

  // It's good when results are stable.
  return Object.values(projectInfoByPath).sort((a, b) =>
    (a.appmapConfig?.name || '').localeCompare(b.appmapConfig?.name || '')
  );
}
