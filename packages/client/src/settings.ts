import { readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import yaml from 'js-yaml';

type AppLandContext = {
  url: string;
  api_key: string;
};

type AppLandConfig = {
  contexts: Record<string, AppLandContext>;
  current_context: string | undefined;
};

type Settings = {
  baseURL: string | undefined;
  apiKey: string | undefined;
  valid: boolean;
};

const failUsage = (message: string): Settings => {
  console.warn(message);
  return { valid: false } as Settings;
};

function loadFromFile(): Settings {
  const applandConfigFilePath = join(homedir(), '.appland');
  let applandConfigData: Buffer | undefined;
  try {
    applandConfigData = readFileSync(applandConfigFilePath);
  } catch {
    return {} as Settings;
  }
  const applandConfig = yaml.load(
    applandConfigData.toString()
  ) as AppLandConfig;
  const currentContext = applandConfig.current_context || 'default';
  const contextConfig = applandConfig.contexts[currentContext];
  if (!contextConfig) {
    return failUsage(
      `No context configuration '${currentContext}' in AppMap Cloud config file ${applandConfigFilePath}`
    );
  }
  const { url: configURL, api_key: configApiKey } = contextConfig;
  if (!configURL) {
    return failUsage(
      `No 'url' in context configuration '${currentContext}' in AppMap Cloud config file ${applandConfigFilePath}`
    );
  }
  if (!configApiKey) {
    return failUsage(
      `No 'api_key' in context configuration '${currentContext}' in AppMap Cloud config file ${applandConfigFilePath}`
    );
  }

  return { baseURL: configURL, apiKey: configApiKey, valid: true };
}

function loadFromEnvironment(settings: Settings): void {
  if (process.env.APPLAND_URL) {
    settings.baseURL = process.env.APPLAND_URL;
  }
  if (process.env.APPLAND_API_KEY) {
    settings.apiKey = process.env.APPLAND_API_KEY;
  }
}

export default ((): Settings => {
  const settings = loadFromFile();
  loadFromEnvironment(settings);
  return settings;
})();
