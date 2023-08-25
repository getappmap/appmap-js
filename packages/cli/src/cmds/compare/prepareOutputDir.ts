import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import readline from 'readline';
import { exists } from '../../utils';
import { RevisionName } from './RevisionName';
import { confirm, sanitizeRevision } from './ui';
import { ValidationError } from './ValidationError';

export async function prepareOutputDir(
  outputDirArg: any,
  baseRevision: string,
  headRevision: string,
  clobberOutputDir: boolean,
  rl: readline.Interface
): Promise<string> {
  let outputDir = outputDirArg;
  if (!outputDir) {
    outputDir = join(
      '.appmap',
      'change-report',
      [sanitizeRevision(baseRevision), sanitizeRevision(headRevision)].join('-')
    );
  }

  const headExists = await exists(join(outputDir, RevisionName.Head));
  if (!headExists) {
    const msg = `Head revision directory (${join(outputDir, RevisionName.Head)}) does not exist`;
    throw new ValidationError(msg);
  }

  const baseExists = await exists(join(outputDir, RevisionName.Base));
  if (!baseExists) {
    const msg = [
      'Warning:',
      `Base revision directory (${join(outputDir, RevisionName.Base)}) does not exist.`,
      'No baseline data will be available.',
    ].join(' ');
    console.warn(msg);
  }

  const diffDir = join(outputDir, RevisionName.Diff);
  if (await exists(diffDir)) {
    if (
      !clobberOutputDir &&
      process.stdout.isTTY &&
      !(await confirm(`Delete existing 'diff' in ${diffDir}?`, rl))
    ) {
      throw new ValidationError(
        `The 'diff' data directory ${diffDir} exists and you chose not to delete it`
      );
    }
    await rm(diffDir, { recursive: true, force: true });
    // Rapid rm and then mkdir will silently fail in practice.
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  }

  await mkdir(join(outputDir, RevisionName.Diff), { recursive: true });

  return outputDir;
}
