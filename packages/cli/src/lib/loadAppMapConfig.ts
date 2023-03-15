import { readFile } from 'fs/promises';
import { load } from 'js-yaml';

interface PreflightFilterConfig {
  groups?: string[];
  names?: string[];
}

interface PreflightConfig {
  base_branch?: string;
  test_command?: string;
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
