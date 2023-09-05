import { Usage } from '@appland/client';
import { Metadata } from '@appland/models';
import { Git } from '../telemetry';
import type { UsageUpdateDto } from '@appland/client';
import sanitizeURL from './repositoryInfo';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function buildMetadata(appmapDir: string, metadata?: Metadata): Promise<string> {
  const repository = await Git.repository(appmapDir);
  const branch = await Git.branch(appmapDir);
  const commit = await Git.commit(appmapDir);

  return JSON.stringify({
    app: metadata?.app,
    language: metadata?.language,
    client: metadata?.client,
    frameworks: metadata?.frameworks,
    git: {
      repository: repository ? sanitizeURL(repository) : undefined,
      branch: branch,
      commit: commit,
    },
    recorder: metadata?.recorder,
  });
}

export default async function emitUsage(
  appmapDir: string,
  numEvents: number,
  numAppMaps: number,
  sampleMetadata?: Metadata
): Promise<void> {
  const dto: UsageUpdateDto = {
    events: numEvents,
    appmaps: numAppMaps,
    metadata: await buildMetadata(appmapDir, sampleMetadata),
    ci: process.env.CI !== undefined,
  };

  try {
    const stats = await stat('.appmap');
    if (stats.isDirectory()) {
      const runStatsDirectory = join('.appmap', 'run-stats');
      await mkdir(runStatsDirectory, { recursive: true });

      const statsFilePath = join(runStatsDirectory, `${Date.now().toString()}.json`);
      await writeFile(statsFilePath, JSON.stringify(dto));
    }
  } catch (e) {
    if (e instanceof Error && 'code' in e && e.code !== 'ENOENT') {
      console.warn(`Unable to write metadata: ${e}`);
    }
  }
}
