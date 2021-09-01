const { join } = require('path');
const { homedir } = require('os');
const { statSync, readFileSync } = require('fs');
const yaml = require('js-yaml');

/**
 * @param {string} msg
 * @returns {{baseURL: string, apiKey: string, exists: boolean}}
 */
const failUsage = (msg) => {
  console.warn(msg);
  return { baseURL: null, apiKey: null, exists: false };
};

const { baseURL, apiKey, exists } =
  /**
   * @returns {{baseURL, apiKey}}
   */
  (() => {
    const applandConfigFilePath = join(homedir(), '.appland');
    let applandConfigStat;
    try {
      applandConfigStat = statSync(applandConfigFilePath);
    } catch (e) {
      if (e.toString().includes('ENOENT')) {
        return failUsage(
          `AppMap Cloud config file ${applandConfigFilePath} does not exist`
        );
      }
    }
    if (!applandConfigStat.isFile()) {
      return failUsage(
        `AppMap Cloud config file ${applandConfigFilePath} is not a file`
      );
    }
    const applandConfig = /** @type {object} */ (
      yaml.load(readFileSync(applandConfigFilePath).toString())
    );
    if (!applandConfig) {
      return failUsage(
        `AppMap Cloud config file ${applandConfigFilePath} is empty`
      );
    }

    const currentContext =
      /** @type {string} */ applandConfig.current_context || 'default';
    const contextConfig =
      /** @type {import('./types').Context} */ applandConfig.contexts[
        currentContext
      ];
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

module.exports = {
  baseURL,
  apiKey,
  exists,
};
