import { execFile } from 'child_process';
import { cp, mkdir, readFile, rm, unlink } from 'fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'path';
import { ArchiveMetadata } from '../../lib/ArchiveMetadata';

function tar(args: string[], cwd: string): Promise<void> {
  return new Promise<void>((resolveCB, rejectCB) => {
    execFile('tar', args, { cwd }, (error) => (error ? rejectCB(error) : resolveCB()));
  });
}

// A path named in appmap_archive.json is relative to the restore directory. A path that
// is absolute, or climbs out with '..', is refused, so a restore never writes or deletes
// files outside the directory it was asked to restore into.
export function confinedPath(outputDir: string, path: string): string {
  if (isAbsolute(path)) throw new Error(`Archive path ${path} must be relative`);

  const target = resolve(outputDir, path);
  const rel = relative(resolve(outputDir), target);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel))
    throw new Error(`Archive path ${path} is outside ${outputDir}`);

  return target;
}

export default async function unpackArchive(outputDir: string, archivePath: string) {
  await mkdir(outputDir, { recursive: true });
  const archiveFile = resolve(archivePath);

  await tar(['xf', archiveFile], outputDir);
  await tar(['xf', 'appmaps.tar.gz'], outputDir);
  await unlink(join(outputDir, 'appmaps.tar.gz'));

  const metadata: ArchiveMetadata = JSON.parse(
    await readFile(join(outputDir, 'appmap_archive.json'), 'utf8')
  );
  // Same name as always: appmap_archive.<revision>.json.
  const revisionMetadataFile = confinedPath(outputDir, `appmap_archive.${metadata.revision}.json`);
  await cp(join(outputDir, 'appmap_archive.json'), revisionMetadataFile);

  // Check every path before deleting anything.
  const deletedAppMaps = (metadata.deletedAppMaps || []).map((path) =>
    confinedPath(outputDir, path)
  );
  for (const appmapFile of deletedAppMaps) {
    await unlink(appmapFile);
    // The index directory sits next to the AppMap file, with the same name minus the extension.
    await rm(join(dirname(appmapFile), basename(appmapFile, '.appmap.json')), {
      recursive: true,
      force: true,
    });
  }
}
