import { readFile } from 'fs/promises';
import { basename, dirname, join } from 'path';

export default async function readIndexFile(appmap: string, indexFileName: string) {
  const indexFilePath = join(dirname(appmap), basename(appmap, '.appmap.json'), indexFileName);
  return JSON.parse(await readFile(indexFilePath, 'utf-8'));
}
