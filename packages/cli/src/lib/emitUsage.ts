import { Metadata } from '@appland/models';
import { Usage, type UsageUpdateDto } from '@appland/client';
import { warn } from 'node:console';
import { existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Git } from '@appland/telemetry';
import sanitizeURL from './repositoryInfo';

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

/**
 * Collects usage data for AppMap events and files.
 */
export async function collectUsageData(
  appmapDir: string,
  numEvents: number,
  numAppMaps: number,
  sampleMetadata?: Metadata
): Promise<UsageUpdateDto> {
  const metadata = sampleMetadata ? await buildMetadata(appmapDir, sampleMetadata) : undefined;

  return {
    events: numEvents,
    appmaps: numAppMaps,
    metadata,
    ci: process.env.CI !== undefined,
  };
}

/**
 * Generates and writes usage statistics for AppMap events and files.
 * The function builds metadata, reads the AppMap configuration, and saves the statistics
 * to a JSON file in a specified directory.
 *
 * The output directory can be fully specified, or it will default to `${appmapDir}/.run-stats`.
 */

export default async function writeUsageData(
  usageData: UsageUpdateDto,
  appmapDir: string,
  outputDir?: string
): Promise<string | undefined> {
  const runStatsDirectory = outputDir ?? join(appmapDir, '.run-stats');
  if (!existsSync(runStatsDirectory)) {
    try {
      mkdirSync(runStatsDirectory, { recursive: true });
    } catch (e) {
      warn(`Unable to create run stats directory: ${String(e)}`);
      return;
    }
  }

  const statsFilePath = join(runStatsDirectory, `${Date.now().toString()}.json`);
  try {
    await writeFile(statsFilePath, JSON.stringify(usageData));
  } catch (e) {
    warn(`Unable to write run stats file ${statsFilePath}: ${String(e)}`);
  }

  return statsFilePath;
}

export type UsageDataResponse = {
  sent: boolean;
  filePath?: string;
};

export async function sendUsageData(
  usageData: UsageUpdateDto,
  appmapDir: string
): Promise<UsageDataResponse> {
  try {
    await Usage.update(usageData);
    return { sent: true };
  } catch (err) {
    warn(`Failed to send usage data: ${String(err)}`);
    const filePath = await writeUsageData(usageData, appmapDir);
    return { sent: false, filePath };
  }
}
