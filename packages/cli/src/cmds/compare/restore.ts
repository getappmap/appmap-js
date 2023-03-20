import { join } from 'path';
import { handler as restoreCmd } from '../archive/restore';
import { checkout } from './checkout';
import { RevisionName } from './RevisionName';

export async function restore(
  outputDir: string,
  archiveDir: string,
  revisionName: RevisionName,
  revision: string
) {
  await checkout(revisionName, revision);

  await restoreCmd({
    revision: revision,
    outputDir: join(outputDir, revisionName),
    archiveDir: archiveDir,
  });
}
