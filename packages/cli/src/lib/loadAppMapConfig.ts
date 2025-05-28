import { readFile } from 'fs/promises';
import { load } from 'js-yaml';

export type HideOption =
  | 'sql_pragma'
  | 'sql_savepoint'
  | 'sql_show'
  | 'pg_metadata'
  | 'sqlite_metadata'
  | 'selenium'
  | 'ruby_included';

// This type is similar to FilterState in @appland/models, but only contains the
// fields that are likely to be used for creating a canonical sequence diagram.
export type CompareFilter = {
  hide_external?: boolean;
  dependency_folders?: string[];
  hide_name?: string[];
  hide?: HideOption[];
  reveal?: HideOption[];
};

export interface CompareConfig {
  filter?: CompareFilter;
}

export interface UpdateConfig {
  test_folders?: string[];
  test_commands?: Record<string, string>;
}

export type ConfiguredPackage = {
  path?: string;
};

export type LanguageName = string;

export type CommandString = string;

export type TestCommand = {
  language: LanguageName;
  command: CommandString;
  shell?: string;
  timeout?: number;
};

export interface AppMapConfig {
  name: string;
  language?: string;
  appmap_dir?: string;
  packages: ConfiguredPackage[];
  compare?: CompareConfig;
  update?: UpdateConfig;
  test_commands?: TestCommand[];
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
