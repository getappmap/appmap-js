import { existsSync, writeFileSync, writeSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { RequestOptions } from 'http';
import { dump, load } from 'js-yaml';
import { join } from 'path';

let AppMapConfigFilePath = 'appmap.yml';
let AppMapSettingsFilePath = join(process.env.HOME || '', '.appmaprc');

export type RemoteRecordingConfig = {
  path?: string;
  protocol?: string;
};

export type TestCommand = {
  env: Record<string, string>;
  command: string;
};

export type TestRecordingConfig = {
  test_commands?: TestCommand[];
};

export type AppMapConfig = {
  name: string;
  language?: string;
  appmap_dir?: string;
  test_recording?: TestRecordingConfig;
  remote_recording?: RemoteRecordingConfig;
};

export type AppMapSettings = {
  max_time?: number;
};

const DefaultAppMapDir: Record<string, string> = {
  ruby: 'tmp/appmap',
  python: 'tmp/appmap',
};

// Returns the previous config file path.
export function setAppMapConfigFilePath(appMapFile: string): string {
  const oldPath = AppMapConfigFilePath;
  AppMapConfigFilePath = appMapFile;
  if (!existsSync(appMapFile)) {
    console.log(`Warning: AppMap config file ${appMapFile} does not exist.`);
  }
  return oldPath;
}

// Returns the previous settings file path.
export function setAppMapSettingsFilePath(appMapFile: string): string {
  const oldPath = AppMapSettingsFilePath;
  AppMapSettingsFilePath = appMapFile;
  return oldPath;
}

export async function readConfig(): Promise<AppMapConfig | undefined> {
  let fileContents: Buffer | undefined;
  try {
    fileContents = await readFile(AppMapConfigFilePath);
  } catch {
    return;
  }
  const config = load(fileContents.toString()) as AppMapConfig;
  if (config.language) config.appmap_dir ||= DefaultAppMapDir[config.language];
  return config;
}

export async function readAllSettings(): Promise<AppMapSettings> {
  let settings: any;
  try {
    const fileContents = await readFile(AppMapSettingsFilePath);
    settings = load(fileContents.toString()) as any;
    // Make sure settings is an object.
    settings[AppMapConfigFilePath];
  } catch {
    settings = {};
  }
  if (!settings[AppMapConfigFilePath]) {
    settings[AppMapConfigFilePath] = {};
  }
  return settings;
}

async function readSettings(): Promise<any> {
  return (await readAllSettings())[AppMapConfigFilePath];
}

async function writeConfig(config: any) {
  await writeFile(AppMapConfigFilePath, dump(config));
}

async function writeSettings(settings: any) {
  await writeFile(AppMapSettingsFilePath, dump(settings));
}

export async function requestOptions(): Promise<RequestOptions> {
  const requestOptions = {} as RequestOptions;

  requestOptions.hostname = (
    await readSetting('remote_recording.host', 'localhost')
  ).toString();
  requestOptions.port = (await readSetting(
    'remote_recording.port',
    3000
  )) as number;
  requestOptions.path = (
    await readConfigOption('remote_recording.path', '/')
  ).toString();
  requestOptions.protocol = (
    await readConfigOption('remote_recording.protocol', 'http:')
  ).toString();

  return requestOptions;
}

export async function readSetting(
  path: string,
  defaultValue: string | number
): Promise<string | number | TestCommand[]> {
  const settings = await readSettings();
  return findOption(settings, path, defaultValue);
}

export async function readConfigOption(
  path: string,
  defaultValue: string | number | TestCommand[]
): Promise<string | number | TestCommand[]> {
  const config = await readConfig();
  return findOption(config, path, defaultValue);
}

function findOption(
  data: any,
  path: string,
  defaultValue: string | number | TestCommand[]
): string | number | TestCommand[] {
  if (!data) return defaultValue;

  const tokens = path.split('.');
  let entry = data;
  for (const token of tokens) {
    if (!entry) return defaultValue;
    entry = entry[token];
  }

  return entry || defaultValue;
}

export async function writeSetting(path: string, value: string | number) {
  const allSettings = await readAllSettings();
  const settings = allSettings[AppMapConfigFilePath];
  mergeConfigData(settings, path, value);
  await writeSettings(allSettings);
}

export async function writeConfigOption(
  path: string,
  value: string | number | TestCommand[]
) {
  const config = await readConfig();
  if (!config) return;

  mergeConfigData(config, path, value);
  await writeConfig(config);
}

function mergeConfigData(
  data: any,
  path: string,
  value: string | number | TestCommand[]
): void {
  const tokens = path.split('.');
  const lastToken = tokens.pop()!;
  let entry = data;
  for (const token of tokens) {
    if (!entry[token]) {
      entry[token] = {};
    }
    entry = entry[token];
  }
  if (typeof entry === 'object') {
    if (entry[lastToken] !== value) {
      entry[lastToken] = value;
    }
  }
}
