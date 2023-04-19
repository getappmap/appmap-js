import { readFile } from 'fs/promises';
import { load } from 'js-yaml';

export interface PreflightFilterConfig {
  groups?: string[];
  names?: string[];
}

export interface PreflightConfig {
  test_folders?: string[];
  test_commands?: Record<string, string>;
  filter?: PreflightFilterConfig;
}

export interface AppMapConfig {
  name: string;
  language?: string;
  appmap_dir?: string;
  preflight?: PreflightConfig;
}

export default async function loadAppMapConfig(): Promise<AppMapConfig | undefined> {
  let appMapConfigData: string | undefined;
  try {
    appMapConfigData = await readFile('appmap.yml', 'utf-8');
  } catch (e) {
    return;
  }

  const appMapConfig = load(appMapConfigData) as any;
  if (appMapConfig && typeof appMapConfig === 'object') {
    return appMapConfig as AppMapConfig;
  }
}
