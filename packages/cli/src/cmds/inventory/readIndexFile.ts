import { readFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import { exists } from '../../utils';

export default async function readIndexFile(
  appmap: string,
  indexFileName: string
): Promise<any[] | any | undefined> {
  const indexFilePath = join(dirname(appmap), basename(appmap, '.appmap.json'), indexFileName);
  if (!(await exists(indexFilePath))) return;

  return JSON.parse(await readFile(indexFilePath, 'utf-8'));
}
