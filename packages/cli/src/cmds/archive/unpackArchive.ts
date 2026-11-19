import { execFile } from 'child_process';
import { cp, mkdir, readFile, realpath, rm, unlink } from 'fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'path';
import { ArchiveMetadata } from '../../lib/ArchiveMetadata';
import { exists } from '../../utils';

function tar(args: string[], cwd: string): Promise<void> {
  return new Promise<void>((resolveCB, rejectCB) => {
    execFile('tar', args, { cwd }, (error) => (error ? rejectCB(error) : resolveCB()));
  });
}

// An archive may come from somewhere else, so a path it names must resolve to a
// location inside the output directory, after following symlinks.
export async function confinedPath(outputDir: string, path: string): Promise<string> {
  const root = await realpath(outputDir);
  const outside = (target: string) => {
    const rel = relative(root, target);
    return rel === '' || rel.startsWith('..') || isAbsolute(rel);
  };

  if (isAbsolute(path)) throw new Error(`Archive path ${path} must be relative`);
  const target = resolve(root, path);
  if (outside(target)) throw new Error(`Archive path ${path} is outside ${outputDir}`);

  // Check where the parent directory really is, in case it is a symlink.
  const parent = dirname(target);
  if ((await exists(parent)) && outside(join(await realpath(parent), basename(target))))
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
  const revisionMetadataFile = await confinedPath(
    outputDir,
    `appmap_archive.${basename(String(metadata.revision))}.json`
  );
  await cp(join(outputDir, 'appmap_archive.json'), revisionMetadataFile);

  // Check every path before deleting anything.
  const deletedAppMaps = await Promise.all(
    (metadata.deletedAppMaps || []).map((path) => confinedPath(outputDir, path))
  );
  for (const appmapFile of deletedAppMaps) {
    await rm(appmapFile, { force: true });
    // The index directory sits next to the AppMap file, with the same name minus the extension.
    await rm(join(dirname(appmapFile), basename(appmapFile, '.appmap.json')), {
      recursive: true,
      force: true,
    });
  }
}
