import {
  Telemetry,
  type BackendConfiguration,
  type TelemetryConfiguration,
} from '@appland/telemetry';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import makeDebug from 'debug';

const debug = makeDebug('appmap:cli:config');

export type GlobalConfiguration = {
  version: '1';
  telemetry?: BackendConfiguration;
};

function validateConfiguration(config: unknown): asserts config is GlobalConfiguration {
  if (typeof config !== 'object' || config === null) {
    throw new Error(`Invalid configuration format`);
  }
  if (!('version' in config) || typeof config.version !== 'string') {
    throw new Error(`Missing or invalid version in configuration`);
  }
  if (config.version !== '1') {
    throw new Error(`Unsupported configuration version: ${config.version}`);
  }
}

async function loadFromFile(configPath: string): Promise<GlobalConfiguration | undefined> {
  try {
    const configContent = await readFile(configPath, 'utf8');
    const config = JSON.parse(configContent) as GlobalConfiguration;
    validateConfiguration(config);
    debug(`Loaded bundled configuration from ${configPath}`);
    return config;
  } catch (e) {
    debug(`Failed to load bundled configuration from ${configPath}: ${String(e)}`);
    return undefined;
  }
}

function loadFromBundle(): Promise<GlobalConfiguration | undefined> {
  const configPath = join(__dirname, '..', 'global-config.json');
  return loadFromFile(configPath);
}

function loadFromEnv(): Promise<GlobalConfiguration | undefined> {
  const configPath = process.env.APPMAP_CONFIG_PATH;
  if (!configPath) {
    return Promise.resolve(undefined);
  }
  return loadFromFile(configPath);
}

const DEFAULT_TELEMETRY_CONFIG: Partial<TelemetryConfiguration> = {
  product: {
    name: '@appland/appmap',
    version: require('../package.json').version,
  },
};

const applyFns = {
  '1': (config: GlobalConfiguration) => {
    const telemetryConfig: Partial<TelemetryConfiguration> = { ...DEFAULT_TELEMETRY_CONFIG };
    if (config.telemetry) telemetryConfig.backend = config.telemetry;
    Telemetry.configure(telemetryConfig);
  },
} as const;

export async function applyGlobalConfiguration(): Promise<void> {
  const sources = [loadFromEnv, loadFromBundle];
  for (const loadConfig of sources) {
    const config = await loadConfig();
    if (config) {
      if (config.version in applyFns) {
        applyFns[config.version](config);
        debug(`Applied global configuration from ${loadConfig.name}`);
      } else {
        // This should never happen if the configuration is validated correctly
        debug(`Unsupported configuration version: ${config.version}`);
      }
      return;
    }
  }

  Telemetry.configure(DEFAULT_TELEMETRY_CONFIG);
  debug('No global configuration applied');
}
