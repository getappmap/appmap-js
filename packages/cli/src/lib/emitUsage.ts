import { Metadata } from '@appland/models';
import { Git } from '../telemetry';
import type { UsageUpdateDto } from '@appland/client';
import sanitizeURL from './repositoryInfo';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import loadAppMapConfig from './loadAppMapConfig';
import { warn } from 'node:console';

async function buildMetadata(appmapDir: string, metadata: Metadata): Promise<Metadata> {
  const repository = await Git.repository(appmapDir);

  const result: Metadata = {
    name: metadata.name,
    app: metadata.app,
    language: metadata.language,
    client: metadata.client,
    frameworks: metadata.frameworks,
    recorder: metadata.recorder,
  };

  if (repository) {
    const branch = await Git.branch(appmapDir);
    const commit = await Git.commit(appmapDir);
    const git = {
      repository: sanitizeURL(repository),
    } as Metadata.Git; // Technically, branch and commit are required
    if (branch) git.branch = branch;
    if (commit) git.commit = commit;

    result.git = git;
  }

  return result;
}

export default async function emitUsage(
  appmapDir: string,
  numEvents: number,
  numAppMaps: number,
  sampleMetadata?: Metadata
): Promise<string | undefined> {
  let metadata: Metadata | undefined;
  if (sampleMetadata) metadata = await buildMetadata(appmapDir, sampleMetadata);

  const appmapConfig = await loadAppMapConfig();
  if (!appmapConfig) warn(`Unable to load appmap.yml config file`);

  const dto: UsageUpdateDto = {
    events: numEvents,
    appmaps: numAppMaps,
    metadata,
    ci: process.env.CI !== undefined,
    appmapConfig,
  } as UsageUpdateDto;

  try {
    const stats = await stat('.appmap');
    if (stats.isDirectory()) {
      const runStatsDirectory = join('.appmap', 'run-stats');
      await mkdir(runStatsDirectory, { recursive: true });

      const statsFilePath = join(runStatsDirectory, `${Date.now().toString()}.json`);
      await writeFile(statsFilePath, JSON.stringify(dto));
      return statsFilePath;
    }
  } catch (e) {
    if (e instanceof Error && 'code' in e && e.code !== 'ENOENT') {
      console.warn(`Unable to write run stats: ${e}`);
    }
  }
}
