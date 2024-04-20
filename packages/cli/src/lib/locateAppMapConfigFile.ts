import { join, resolve } from 'path';
import { exists } from '../utils';

export async function locateAppMapConfigFile(appmapDir: string): Promise<string | undefined> {
  let dir: string = appmapDir;
  for (;;) {
    const appmapFile = join(dir, 'appmap.yml');
    if (await exists(appmapFile)) return appmapFile;

    const parentDir = resolve(dir, '..');
    if (parentDir === '/' || parentDir === dir) break;

    dir = parentDir;
  }
}
