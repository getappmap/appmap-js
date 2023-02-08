import { exists } from 'fs';
import { readFile } from 'fs/promises';
import { load } from 'js-yaml';
import { promisify } from 'util';

export interface AppMapConfig {
  name: string;
  appmap_dir?: string;
}

export default async function loadAppMapConfig(): Promise<AppMapConfig | undefined> {
  const appMapConfigExists = await promisify(exists)('appmap.yml');
  if (appMapConfigExists) {
    const appMapConfigData = load((await readFile('appmap.yml')).toString());
    if (appMapConfigData && typeof appMapConfigData === 'object') {
      return appMapConfigData as AppMapConfig;
    }
  }
}
