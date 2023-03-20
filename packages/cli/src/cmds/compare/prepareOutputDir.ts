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
    outputDir = `change-report/${sanitizeRevision(baseRevision)}-${sanitizeRevision(headRevision)}`;
  }

  if (await exists(outputDir)) {
    if (clobberOutputDir || !(await confirm(`Use existing data directory ${outputDir}?`, rl))) {
      if (
        !clobberOutputDir &&
        !(await confirm(`Delete existing data directory ${outputDir}?`, rl))
      ) {
        throw new ValidationError(
          `The data directory ${outputDir} exists but you don't want to use it or delete it`
        );
      }
      await rm(outputDir, { recursive: true, force: true });
      // Rapid rm and then mkdir will silently fail in practice.
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    }
  }

  await mkdir(outputDir, { recursive: true });
  await mkdir(join(outputDir, RevisionName.Base), { recursive: true });
  await mkdir(join(outputDir, RevisionName.Diff), { recursive: true });
  await mkdir(join(outputDir, RevisionName.Head), { recursive: true });

  return outputDir;
}
