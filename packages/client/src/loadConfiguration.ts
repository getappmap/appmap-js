import Configuration from './configuration';

export const DefaultURL = 'https://getappmap.com';
export const DefaultApiURL = 'https://api.getappmap.com';

const DefaultConfiguration: Configuration = {
  baseURL: DefaultURL,
  apiURL: DefaultApiURL,
};

class Settings {
  baseURL = DefaultURL;
  apiURL = DefaultApiURL;
  apiKey?: string;
}

function loadFromEnvironment(): Settings {
  const settings = new Settings();

  ['APPLAND_API_URL', 'APPMAP_API_URL'].forEach((key) => {
    const value = process.env[key];
    if (value) settings.apiURL = value;
  });
  ['APPLAND_URL', 'APPMAP_URL'].forEach((key) => {
    const value = process.env[key];
    if (value) settings.baseURL = value;
  });
  ['APPLAND_API_KEY', 'APPMAP_API_KEY'].forEach((key) => {
    const value = process.env[key];
    if (value) settings.apiKey = value;
  });

  return settings;
}

let configuration: Configuration;

export function setConfiguration(value: Partial<Configuration>): void {
  configuration = {
    ...DefaultConfiguration,
    ...value,
  };
}

export default function loadConfiguration(requireApiKey = true): Configuration {
  if (configuration) {
    return configuration;
  }

  const settings = loadFromEnvironment();
  if (!settings.apiKey && requireApiKey) {
    throw new Error(
      `No API key available for AppMap server. Set environment variable APPMAP_API_KEY (preferred), or provide the API key as a command line argument`
    );
  }

  configuration = { baseURL: settings.baseURL, apiURL: settings.apiURL, apiKey: settings.apiKey };
  if (settings.apiKey) {
    const username = usernameFromKey(settings.apiKey);
    if (username) {
      configuration.username = username;
    }
  }
  return configuration;
}

export function getConfiguration(): Configuration {
  return configuration;
}

/** Extract the username from the API key.
 * The API key is of the form base64(username:random).
 */
function usernameFromKey(apiKey: string): string | undefined {
  const decoded = Buffer.from(apiKey, 'base64').toString('utf-8');
  const match = decoded.match(/^(.+?):/);
  return match ? match[1] : undefined;
}
