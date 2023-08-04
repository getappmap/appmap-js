import { Usage } from '@appland/client';
import { Metadata } from '@appland/models';
import { Git } from '../telemetry';
import type { UsageUpdateDto } from '@appland/client';
import sanitizeURL from './repositoryInfo';
import { verbose } from '../utils';

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
): Promise<UsageUpdateDto> {
  const contributors = await Git.contributors(90);
  const dto: UsageUpdateDto = {
    events: numEvents,
    appmaps: numAppMaps,
    contributors: contributors.length,
    metadata: await buildMetadata(appmapDir, sampleMetadata),
    ci: process.env.CI !== undefined,
  };

  Usage.update(dto).catch((e) => {
    // If this fails, it's not a big deal.
    // In the future, we may want to cache and aggregate numEvents on
    // disk and try again at a later date. The client will retry on its
    // own, so we don't need to do it here.
    if (verbose()) {
      console.warn('Failed to update usage', e);
    }
  });

  return dto;
}
