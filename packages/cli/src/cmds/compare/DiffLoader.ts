import parseDiff from 'parse-diff';
import { executeCommand } from '../../lib/executeCommand';
import { warn } from 'console';
import assert from 'assert';

export const MAX_DIFF_LENGTH = 1000 * 1000;

export default class DiffLoader {
  private sourcePathRoots = new Set<string>();
  private diffByFile: Map<string, parseDiff.File[]> | undefined;
  private reloadQueue: Array<string[]> = [];

  constructor(public baseRevision: string, public headRevision: string) {}

  async update(sourcePathRoots: Set<string>) {
    let reloadDiff = false;
    for (const root of sourcePathRoots) {
      if (!this.sourcePathRoots.has(root)) {
        this.sourcePathRoots.add(root);
        reloadDiff = true;
      }
    }

    if (this.diffByFile && !reloadDiff) return;

    this.reloadQueue.push([...this.sourcePathRoots]);

    await this.reloadDiff();
  }

  private async reloadDiff() {
    while (this.reloadQueue.length > 0) {
      const sourcePathRoots = this.reloadQueue.shift()!.sort();
      try {
        const diffStr = await executeCommand(
          `git diff ${this.baseRevision}..${this.headRevision} -- ${sourcePathRoots.join(' ')}}`
        );
        if (diffStr.length > MAX_DIFF_LENGTH) {
          warn(`Diff is too large to parse. Skipping...`);
          continue;
        }

        const diffFiles = parseDiff(diffStr);
        this.diffByFile = diffFiles.reduce((memo, diffFile) => {
          [diffFile.to, diffFile.from].filter(Boolean).forEach((path) => {
            assert(path);
            if (!memo.has(path)) memo.set(path, []);
            memo.get(path)?.push(diffFile);
          });
          return memo;
        }, new Map<string, parseDiff.File[]>());
      } catch (err) {
        warn(err);
      }
    }
  }
}
