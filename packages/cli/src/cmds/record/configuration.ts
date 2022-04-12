import { existsSync, writeFileSync, writeSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { RequestOptions } from 'http';
import { dump, load } from 'js-yaml';
import { join } from 'path';

let AppMapConfigFilePath = join(process.cwd(), 'appmap.yml');
let AppMapSettingsFilePath = join(process.env.HOME || '', '.appmaprc');

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

async function readConfig(): Promise<any | undefined> {
  let fileContents: Buffer | undefined;
  try {
    fileContents = await readFile(AppMapConfigFilePath);
  } catch {
    return;
  }
  return load(fileContents.toString());
}

async function readAllSettings(): Promise<any> {
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
    await readSetting('dev_server.host', 'localhost')
  ).toString();
  requestOptions.port = await readSetting('dev_server.port', 3000);
  requestOptions.path = (
    await readConfigOption('dev_server.path', '/')
  ).toString();
  requestOptions.protocol = (
    await readConfigOption('dev_server.protocol', 'http:')
  ).toString();

  return requestOptions;
}

export async function readSetting(
  path: string,
  defaultValue: string | number
): Promise<string | number> {
  const settings = await readSettings();
  return findOption(settings, path, defaultValue);
}

export async function readConfigOption(
  path: string,
  defaultValue: string | number
): Promise<string | number> {
  const config = await readConfig();
  return findOption(config, path, defaultValue);
}

function findOption(
  data: any,
  path: string,
  defaultValue: string | number
): string | number {
  if (!data) return defaultValue;

  const tokens = path.split('.');
  let entry = data;
  for (const token of tokens) {
    if (!entry) return defaultValue;
    entry = entry[token];
  }
  if (typeof entry === 'object') return defaultValue;

  return entry || defaultValue;
}

export async function writeSetting(path: string, value: string | number) {
  const allSettings = await readAllSettings();
  const settings = allSettings[AppMapConfigFilePath];
  mergeConfigData(settings, path, value);
  await writeSettings(allSettings);
}

export async function writeConfigOption(path: string, value: string | number) {
  const config = await readConfig();
  if (!config) return;

  mergeConfigData(config, path, value);
  await writeConfig(config);
}

function mergeConfigData(
  data: any,
  path: string,
  value: string | number
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
