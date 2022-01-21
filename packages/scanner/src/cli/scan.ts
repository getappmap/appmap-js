import { readFile } from 'fs/promises';
import { buildAppMap, Metadata } from '@appland/models';

import Check from '../check';
import RuleChecker from '../ruleChecker';
import { Finding } from '../types';

import progressReporter from './progressReporter';

type Result = {
  appMapMetadata: Record<string, Metadata>;
  findings: Finding[];
};

async function batch<T>(
  items: readonly T[],
  size: number,
  process: (item: T) => PromiseLike<null | undefined>
) {
  const left = [...items];
  while (left.length) await Promise.all(left.splice(0, size).map(process));
}

export default async function scan(files: string[], checks: Check[]): Promise<Result> {
  const checker = new RuleChecker();
  const appMapMetadata: Record<string, Metadata> = {};
  const findings: Finding[] = [];

  await batch(files, 2, async (file: string) => {
    // TODO: Improve this by respecting .gitignore, or similar.
    // For now, this addresses the main problem of encountering appmap-js and its appmap.json files
    // in a bundled node_modules.
    if (file.split('/').includes('node_modules')) {
      return null;
    }
    const appMapData = await readFile(file, 'utf8');
    const appMap = buildAppMap(appMapData).normalize().build();
    appMapMetadata[file] = appMap.metadata;

    await Promise.all(
      checks.map(async (check) => {
        const matchCount = findings.length;
        await checker.check(file, appMap, check, findings);
        const newMatches = findings.slice(matchCount, findings.length);
        newMatches.forEach((match) => (match.appMapFile = file));
        process.stderr.write(progressReporter(newMatches));
      })
    );
  });

  return { appMapMetadata, findings };
}
