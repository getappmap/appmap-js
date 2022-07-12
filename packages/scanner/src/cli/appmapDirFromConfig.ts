import { exists } from 'fs';
import { readFile } from 'fs/promises';
import { load } from 'js-yaml';
import { promisify } from 'util';

export async function appmapDirFromConfig(): Promise<string | undefined> {
  const appMapConfigExists = await promisify(exists)('appmap.yml');
  if (appMapConfigExists) {
    const appMapConfigData = load((await readFile('appmap.yml')).toString());
    if (appMapConfigData && typeof appMapConfigData === 'object') {
      const configData: { appmap_dir?: string } = appMapConfigData;
      return configData['appmap_dir'];
    }
  }
}
