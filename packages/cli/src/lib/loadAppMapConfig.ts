import { FilterState } from '@appland/models';
import { readFile } from 'fs/promises';
import { load } from 'js-yaml';

export interface CompareConfig {
  filter?: FilterState;
}

export interface UpdateConfig {
  test_folders?: string[];
  test_commands?: Record<string, string>;
}

export interface AppMapConfig {
  name: string;
  language?: string;
  appmap_dir?: string;
  compare?: CompareConfig;
  update?: UpdateConfig;
}

export default async function loadAppMapConfig(
  fileName = 'appmap.yml'
): Promise<AppMapConfig | undefined> {
  let appMapConfigData: string | undefined;
  try {
    appMapConfigData = await readFile(fileName, 'utf-8');
  } catch (e) {
    return;
  }

  const appMapConfigAny = load(appMapConfigData) as any;
  if (!appMapConfigAny && !(typeof appMapConfigAny === 'object')) return;

  const appMapConfig = appMapConfigAny as AppMapConfig;
  camelizeKeys(appMapConfig?.compare?.filter);

  return appMapConfig;
}

function camelizeKeys(obj: Record<string, any> | undefined) {
  if (!obj) return;

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const camelizedKey = key.replace(/_([\w])/g, (_, letter) => letter.toUpperCase());
    delete obj[key];
    obj[camelizedKey] = value;
  }
}
