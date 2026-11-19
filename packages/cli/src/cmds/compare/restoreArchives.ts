import { execFile } from 'child_process';
import { rm } from 'fs/promises';
import { join } from 'path';

import { ArchiveMetadata } from '../../lib/ArchiveMetadata';
import { RevisionName } from '../../diffArchive/RevisionName';
import { exists } from '../../utils';
import unpackArchive from '../archive/unpackArchive';
import { ValidationError } from './ValidationError';

// Reads appmap_archive.json out of an archive file, without unpacking the rest of it.
export async function readArchiveMetadata(archivePath: string): Promise<ArchiveMetadata> {
  if (!(await exists(archivePath)))
    throw new ValidationError(`AppMap archive ${archivePath} does not exist`);

  const data = await new Promise<string>((resolve, reject) => {
    execFile(
      'tar',
      ['-xOf', archivePath, 'appmap_archive.json'],
      { maxBuffer: 64 * 1024 * 1024 },
      (error, stdout) => {
        if (error)
          return reject(
            new ValidationError(
              `Unable to read appmap_archive.json from ${archivePath}. Is it an archive made by 'appmap archive'? ${error.message}`
            )
          );
        resolve(stdout);
      }
    );
  });
  return JSON.parse(data) as ArchiveMetadata;
}

// Reads both manifests before anything is written. Only full archives can be compared
// this way: an incremental archive holds only the AppMaps that changed since its base
// revision, and that base is not available here.
export async function checkArchives(
  archives: Record<RevisionName.Base | RevisionName.Head, string>
): Promise<Record<RevisionName.Base | RevisionName.Head, ArchiveMetadata>> {
  const result = {} as Record<RevisionName.Base | RevisionName.Head, ArchiveMetadata>;
  for (const revisionName of [RevisionName.Base, RevisionName.Head] as const) {
    const metadata = await readArchiveMetadata(archives[revisionName]);
    if (metadata.baseRevision)
      throw new ValidationError(
        `${archives[revisionName]} is an incremental archive (it builds on revision ${metadata.baseRevision}). ` +
          `Use a full archive: run 'appmap archive --type full'.`
      );
    result[revisionName] = metadata;
  }
  return result;
}

// Restores the base and head archives into <outputDir>/base and <outputDir>/head,
// the layout that the rest of the compare command reads.
export async function restoreArchives(
  outputDir: string,
  archives: Record<RevisionName.Base | RevisionName.Head, string>,
  clobber: boolean
): Promise<void> {
  for (const revisionName of [RevisionName.Base, RevisionName.Head] as const) {
    const revisionDir = join(outputDir, revisionName);
    if (await exists(revisionDir)) {
      if (!clobber)
        throw new ValidationError(
          `${revisionDir} already exists. Remove it, or use --clobber-output-dir to replace it with the contents of ${archives[revisionName]}.`
        );
      await rm(revisionDir, { recursive: true, force: true });
    }

    console.log(`Restoring ${revisionName} archive ${archives[revisionName]} to ${revisionDir}`);
    await unpackArchive(revisionDir, archives[revisionName]);
  }
}
