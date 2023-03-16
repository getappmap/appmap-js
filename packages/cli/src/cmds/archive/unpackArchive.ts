import { exec } from 'child_process';
import { mkdir, readFile, rename, rmdir, unlink } from 'fs/promises';
import { basename, join, resolve } from 'path';
import { Metadata } from './Metadata';

export default async function unpackArchive(outputDir: any, archivePath: string) {
  await mkdir(outputDir, { recursive: true });

  const dir = process.cwd();
  try {
    process.chdir(outputDir);

    await new Promise<void>((resolveCB, rejectCB) => {
      exec(`tar xf ${resolve(dir, archivePath)}`, (error) => {
        if (error) rejectCB(error);

        resolveCB();
      });
    });
    await new Promise<void>((resolveCB, rejectCB) => {
      exec(`tar xf appmaps.tar.gz`, (error) => {
        if (error) rejectCB(error);

        resolveCB();
      });
    });
    await unlink('appmaps.tar.gz');

    const metadata: Metadata = JSON.parse(await readFile('appmap_archive.json', 'utf8'));
    await rename('appmap_archive.json', `appmap_archive.${metadata.revision}.json`);

    const deletedAppMaps = metadata.deletedAppMaps || [];
    for (const deletedAppMap of deletedAppMaps) {
      await unlink(deletedAppMap);
      await rmdir(basename(deletedAppMap, '.appmap.json'), { recursive: true });
    }
  } finally {
    process.chdir(dir);
  }
}
