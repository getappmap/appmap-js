/* eslint-disable @typescript-eslint/no-empty-function */
import cliProgress from 'cli-progress';
import { readFile } from 'fs/promises';
import { buildAppMap, Metadata } from '@appland/models';

import Check from '../check';
import RuleChecker from '../ruleChecker';
import { Finding } from '../types';

import AppMapIndex from '../appMapIndex';
import assert from 'node:assert';

type Result = {
  appMapMetadata: Record<string, Metadata>;
  findings: Finding[];
};

async function batch<T>(
  items: readonly T[],
  size: number,
  process: (item: T) => PromiseLike<void>
) {
  const left = [...items];
  while (left.length) await Promise.all(left.splice(0, size).map(process));
}

class Progress {
  constructor(private numFiles: number, private numChecks: number) {
    if (process.stdout.isTTY)
      this.bar = new cliProgress.SingleBar(
        { format: `Scanning [{bar}] {percentage}% | {value}/{total}` },
        cliProgress.Presets.shades_classic
      );
    else {
      this.start = this.check = this.file = this.stop = () => {};
    }
  }

  start() {
    this.bar?.start(this.numFiles * this.numChecks, 0);
  }

  check() {
    this.checks += 1;
    this.bar?.increment();
  }

  file() {
    this.bar?.increment(this.numChecks - this.checks);
    this.checks = 0;
  }

  stop() {
    this.bar?.stop();
  }

  bar?: cliProgress.SingleBar;
  checks = 0;
}

export default async function scan(
  files: string[],
  checks: Check[],
  skipErrors = true
): Promise<Result> {
  // TODO: Improve this by respecting .gitignore, or similar.
  // For now, this addresses the main problem of encountering appmap-js and its appmap.json files
  // in a bundled node_modules.
  files = files.filter((file) => !file.split('/').includes('node_modules'));

  const checker = new RuleChecker();
  const appMapMetadata: Record<string, Metadata> = {};
  const findings: Finding[] = [];

  const progress = new Progress(files.length, checks.length);

  let lastError = null;
  let anySuccess = false;

  await batch(files, 2, async (file: string) => {
    try {
      console.log(`scanning ${file}`);
      const appMapData = await readFile(file, 'utf8');
      const appMap = buildAppMap(appMapData).normalize().build();
      const appMapIndex = new AppMapIndex(appMap);
      appMapMetadata[file] = appMap.metadata;

      await Promise.all(
        checks.map(async (check) => {
          const matchCount = findings.length;
          await checker.check(file, appMapIndex, check, findings);
          progress.check();
          const newMatches = findings.slice(matchCount, findings.length);
          newMatches.forEach((match) => (match.appMapFile = file));
        })
      );

      anySuccess = true;
    } catch (error) {
      assert(error instanceof Error);
      lastError = new Error(`Error processing "${file}"`, { cause: error });
      if (!skipErrors) throw lastError;
      console.warn(lastError);
    }
    progress.file();
  });

  progress.stop();

  if (!anySuccess && lastError) throw lastError;

  return { appMapMetadata, findings };
}
