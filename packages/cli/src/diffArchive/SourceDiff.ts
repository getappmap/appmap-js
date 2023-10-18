import parseDiff from 'parse-diff';
import { warn } from 'console';
import assert from 'assert';

import { executeCommand } from '../lib/executeCommand';
import { QueueObject, queue } from 'async';
import { existsSync } from 'fs';

export const MAX_DIFF_LENGTH = 1000 * 1000;

export type SourceDiffItem = {
  command: string;
  files: parseDiff.File[];
};

export class SourceDiffQueue {
  private diffQueue: QueueObject<string>;
  private diffByRoots = new Map<string, SourceDiffItem>();

  constructor(public baseRevision: string, public headRevision: string) {
    this.diffQueue = queue(this.executeDiffCommand.bind(this), 1);
  }

  async diff(sourcePathRoots: Set<string>): Promise<SourceDiffItem | undefined> {
    // Process only one diff at a time.

    if (this.diffQueue.length()) await this.diffQueue.drain();

    const roots = [...sourcePathRoots].sort().join(' ');

    this.diffQueue.push(roots);
    await this.diffQueue.drain();

    return this.diffByRoots.get(roots);
  }

  private async executeDiffCommand(roots: string) {
    if (roots === '') return;

    if (this.diffByRoots.get(roots)) return;

    const command = `git diff ${this.baseRevision}..${this.headRevision} -- ${roots}`;
    let diff: SourceDiffItem = { command, files: [] };
    try {
      const diffStr = await executeCommand(command, true);
      if (diffStr.length > MAX_DIFF_LENGTH) {
        warn(`Diff is too large to parse. Skipping...`);
      } else {
        const files = parseDiff(diffStr);
        diff = { command, files };
      }
    } catch (err) {
      // There's no point in trying this command again.
      warn(err);
    } finally {
      this.diffByRoots.set(roots, diff);
    }
  }
}

export default class SourceDiff {
  private sourcePathRoots = new Set<string>();
  private diffByFile: Map<string, SourceDiffItem> | undefined;
  private diffLoaderQueue: SourceDiffQueue;

  constructor(public baseRevision: string, public headRevision: string) {
    this.diffLoaderQueue = new SourceDiffQueue(baseRevision, headRevision);
  }

  lookupDiff(path: string): string | undefined {
    if (!this.diffByFile) return;

    const diff = this.diffByFile.get(path);
    if (!diff) return;

    const { files: diffFiles } = diff;
    const content = diffFiles
      .map((diffFile) => {
        const fromLine = ['---', diffFile.from].join(' ');
        const toLine = ['+++', diffFile.to].join(' ');
        const content = diffFile.chunks
          .map((chunk) =>
            [chunk.content, chunk.changes.map((change) => change.content).join('\n')].join('\n')
          )
          .join('\n');
        return [fromLine, toLine, content, ''].join('\n');
      })
      .join('\n');
    return [content].join('\n');
  }

  async update(sourcePathRoots: Set<string>) {
    const diffRoots = new Set<string>();
    for (const root of sourcePathRoots) {
      if (!this.sourcePathRoots.has(root)) {
        this.sourcePathRoots.add(root);
        if (SourceDiff.isEligibleFile(root)) diffRoots.add(root);
      }
    }

    const diff = await this.diffLoaderQueue.diff(diffRoots);
    if (diff) this.parseDiffStr(diff);
  }

  static isEligibleFile(root: string): boolean {
    return !['vendor', 'node_modules'].includes(root) && existsSync(root);
  }

  private parseDiffStr(diff: SourceDiffItem) {
    if (!this.diffByFile) this.diffByFile = new Map<string, SourceDiffItem>();

    diff.files.reduce((memo, diffFile) => {
      [...new Set([diffFile.to, diffFile.from])]
        .filter(Boolean)
        .sort()
        .forEach((path) => {
          assert(path);
          if (!memo.has(path)) memo.set(path, { command: diff.command, files: [] });

          memo.get(path)!.files.push(diffFile);
        });
      return memo;
    }, this.diffByFile);
  }
}
