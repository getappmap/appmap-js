import { readFile } from 'fs/promises';
import { homedir } from 'os';
import path from 'path';
import yaml from 'js-yaml';
import Configuration from './configuration';

type AppLandContext = {
  url: string;
  api_key: string;
};

type AppLandConfig = {
  contexts: Record<string, AppLandContext>;
  current_context: string | undefined;
};

const DefaultURL = 'https://app.land';

class Settings {
  baseURL = DefaultURL;
  apiKey?: string;
  error?: string;
}

const failUsage = (message: string): Settings => {
  console.warn(message);
  return { error: message } as Settings;
};

async function loadFromFile(): Promise<Settings> {
  const applandConfigFilePath = path.join(homedir(), '.appland');
  let applandConfigData: Buffer | undefined;
  try {
    applandConfigData = await readFile(applandConfigFilePath);
  } catch {
    return { baseURL: DefaultURL } as Settings;
  }
  const applandConfig = yaml.load(applandConfigData.toString()) as AppLandConfig;
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

  return { baseURL: configURL, apiKey: configApiKey };
}

function loadFromEnvironment(settings: Settings): void {
  if (process.env.APPLAND_URL) {
    settings.baseURL = process.env.APPLAND_URL;
  }
  if (process.env.APPLAND_API_KEY) {
    settings.apiKey = process.env.APPLAND_API_KEY;
  }
}

let configuration: Configuration;

export default async function loadConfiguration(): Promise<Configuration> {
  if (configuration) {
    return configuration;
  }

  const settings = await loadFromFile();
  loadFromEnvironment(settings);
  if (!settings.apiKey) {
    throw new Error(
      `No API key available for AppMap server. Export APPLAND_API_KEY or configure ~/.appland`
    );
  }
  if (settings.error) {
    throw new Error(settings.error);
  }
  configuration = { baseURL: settings.baseURL, apiKey: settings.apiKey };
  return configuration;
}
