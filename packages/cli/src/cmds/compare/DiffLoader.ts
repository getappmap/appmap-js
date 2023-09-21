import parseDiff from 'parse-diff';
import { executeCommand } from '../../lib/executeCommand';
import { warn } from 'console';
import assert from 'assert';
import { exists } from '../../utils';

export const MAX_DIFF_LENGTH = 1000 * 1000;

export default class DiffLoader {
  private sourcePathRoots = new Set<string>();
  private diffByFile: Map<string, parseDiff.File[]> | undefined;
  private reloadQueue: Array<string[]> = [];

  constructor(public baseRevision: string, public headRevision: string) {}

  lookupDiff(path: string): string | undefined {
    assert(this.diffByFile);

    const diffFiles = this.diffByFile.get(path);
    if (!diffFiles) return;

    return diffFiles
      .map((diffFile) =>
        diffFile.chunks
          .map((chunk) =>
            [chunk.content, chunk.changes.map((change) => change.content).join('\n')].join('\n')
          )
          .join('\n')
      )
      .join('\n');
  }

  async update(sourcePathRoots: Set<string>) {
    let reloadDiff = false;
    for (const root of sourcePathRoots) {
      if (['vendor', 'node_modules'].includes(root)) continue;

      if (!(await exists(root))) continue;

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
    const diffCommands = new Set<string>();

    while (this.reloadQueue.length > 0) {
      const sourcePathRoots = this.reloadQueue.shift()!.sort();
      const diffCommand = `git diff ${this.baseRevision}..${
        this.headRevision
      } -- ${sourcePathRoots.join(' ')}`;
      if (diffCommands.has(diffCommand)) continue;

      diffCommands.add(diffCommand);

      try {
        const diffStr = await executeCommand(diffCommand, true);
        if (diffStr.length > MAX_DIFF_LENGTH) {
          warn(`Diff is too large to parse. Skipping...`);
          continue;
        }

        const diffFiles = parseDiff(diffStr);
        this.diffByFile = diffFiles.reduce((memo, diffFile) => {
          [...new Set([diffFile.to, diffFile.from])]
            .filter(Boolean)
            .sort()
            .forEach((path) => {
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
