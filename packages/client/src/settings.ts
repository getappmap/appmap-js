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
  exists: boolean;
};

/**
 * @param {string} msg
 * @returns {{baseURL: string, apiKey: string, exists: boolean}}
 */
const failUsage = (message: string): Settings => {
  console.warn(message);
  return { exists: false } as Settings;
};

export default ((): Settings => {
  const applandConfigFilePath = join(homedir(), '.appland');
  const applandConfigStat = statSync(applandConfigFilePath);
  if (!applandConfigStat.isFile()) {
    return failUsage(
      `AppMap Cloud config file ${applandConfigFilePath} does not exist`
    );
  }
  const applandConfig = yaml.load(
    readFileSync(applandConfigFilePath).toString()
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

  return { baseURL: configURL, apiKey: configApiKey, exists: true };
})();
