import Configuration from './configuration';

<<<<<<< HEAD
export const DefaultURL = 'https://app.land';
=======
const DefaultURL = 'https://app.land';
>>>>>>> 701fa4d5 (feat: Recognize APPMAP_* env vars)

class Settings {
  baseURL = DefaultURL;
  apiKey?: string;
}

function loadFromEnvironment(): Settings {
  const settings = new Settings();

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

export function setConfiguration(value: Configuration): void {
  configuration = value;
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

  configuration = { baseURL: settings.baseURL, apiKey: settings.apiKey };
  return configuration;
}
