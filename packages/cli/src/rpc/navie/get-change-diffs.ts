import { createHash } from 'crypto';

import configuration from '../configuration';
import { getDiffLog, getWorkingDiff } from '../../lib/git';

export async function getChangeDiffsForProjectDirectories(): Promise<string[]> {
  const { projectDirectories } = configuration() ?? [];
  if (projectDirectories.length === 0) {
    return [];
  }
  return getChangeDiffs(projectDirectories);
}

export async function getChangeDiffs(projectDirectories: string[]): Promise<string[]> {
  const diffs = await Promise.allSettled(
    [
      projectDirectories.map((d) => getDiffLog('HEAD', undefined, d)),
      projectDirectories.map((d) => getWorkingDiff(d)),
    ].flat()
  );
  return diffs
    .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
    .map((result) => result.value);
}

export function computeDiffDigest(projectDirectories: string[], diffs: string[]): string {
  const digestStr = [
    'projectDirectories:',
    ...projectDirectories.sort(),
    'diffs:',
    ...diffs.sort(),
  ].join('\n');

  return createHash('sha1').update(digestStr).digest('hex');
}
