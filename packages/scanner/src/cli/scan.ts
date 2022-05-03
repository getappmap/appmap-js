/* eslint-disable @typescript-eslint/no-empty-function */
import cliProgress from 'cli-progress';
import { readFile } from 'fs/promises';
import { buildAppMap, Metadata } from '@appland/models';

import Check from '../check';
import RuleChecker from '../ruleChecker';
import { Finding } from '../types';

import AppMapIndex from '../appMapIndex';

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
  // TODO: Improve this by respecting .gitignore, or similar.
  // For now, this addresses the main problem of encountering appmap-js and its appmap.json files
  // in a bundled node_modules.
  files = files.filter((file) => !file.split('/').includes('node_modules'));

  const checker = new RuleChecker();
  const appMapMetadata: Record<string, Metadata> = {};
  const findings: Finding[] = [];

  function newProgress() {
    if (process.stdout.isTTY) {
      return new cliProgress.SingleBar(
        { format: `Scanning [{bar}] {percentage}% | {value}/{total}` },
        cliProgress.Presets.shades_classic
      );
    }

    return {
      increment: () => {},
      start: () => {},
      stop: () => {},
    };
  }

  const progress = newProgress();
  progress.start(files.length * checks.length, 0);

  await batch(files, 2, async (file: string) => {
    const appMapData = await readFile(file, 'utf8');
    const appMap = buildAppMap(appMapData).normalize().build();
    const appMapIndex = new AppMapIndex(appMap);
    appMapMetadata[file] = appMap.metadata;

    await Promise.all(
      checks.map(async (check) => {
        const matchCount = findings.length;
        await checker.check(file, appMapIndex, check, findings);
        progress.increment();
        const newMatches = findings.slice(matchCount, findings.length);
        newMatches.forEach((match) => (match.appMapFile = file));
      })
    );
    return null;
  });

  progress.stop();

  return { appMapMetadata, findings };
}
