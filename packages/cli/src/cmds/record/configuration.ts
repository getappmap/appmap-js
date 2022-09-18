import assert from 'assert';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { RequestOptions } from 'http';
import { dump, load } from 'js-yaml';
import { isAbsolute, join } from 'path';
import TestCaseRecording from './testCaseRecording';

export type RemoteRecordingConfig = {
  path?: string;
  protocol?: string;
};

export class TestCommand {
  constructor(public command: string, public env: Record<string, string> = {}) {}

  static toString(cmd: TestCommand): string {
    return `${TestCaseRecording.envString(cmd.env)}${cmd.command}`;
  }
}

export type TestRecordingConfig = {
  test_commands?: TestCommand[];
};

export type AppMapConfig = {
  name: string;
  appmap_dir?: string;
  test_recording?: TestRecordingConfig;
  remote_recording?: RemoteRecordingConfig;
};

interface Setting {
  [key: string]: string | number | TestCommand | Setting;
}

export type AppMapSettings = {
  max_time?: number;
} & {
  [key: string]: Setting;
};

export default class Configuration {
  constructor(appMapFile?: string, settingsFile?: string) {
    this.appMapFile = appMapFile || 'appmap.yml';
    this.settingsFile = settingsFile || join(process.env.HOME || '', '.appmaprc');
  }

  async read(): Promise<void> {
    this.config = (await readConfig(this.appMapFile)) || {};
    this.settings = (await readAllSettings(this.settingsFile))[this.settingsKey()] || {};
  }

  async write(): Promise<void> {
    if (this.configDirty) {
      await writeFile(this.appMapFile, dump(this.config));
      this.configDirty = false;
    }

    if (this.settingsDirty) {
      const all = await readAllSettings(this.settingsFile);
      assert(this.settings);
      all[this.settingsKey()] = this.settings;
      await writeFile(this.settingsFile, dump(all));
      this.settingsDirty = false;
    }
  }
  configOption(
    path: string,
    defaultValue: string | number | TestCommand[]
  ): string | number | TestCommand[] {
    return findOption(this.config, path, defaultValue);
  }

  setConfigOption(path: string, value: string | number | TestCommand[]) {
    mergeConfigData(this.config, path, value);
    this.configDirty = true;
  }

  setting(
    path: string,
    defaultValue: string | number | TestCommand[]
  ): string | number | TestCommand[] {
    return findOption(this.settings, path, defaultValue);
  }

  setSetting(path: string, value: string | number | TestCommand[]) {
    mergeConfigData(this.settings, path, value);
    this.settingsDirty = true;
  }

  requestOptions(): RequestOptions {
    const requestOptions = {} as RequestOptions;

    requestOptions.hostname = this.setting('remote_recording.host', 'localhost').toString();
    requestOptions.port = this.setting('remote_recording.port', 3000) as number;
    requestOptions.path = this.configOption('remote_recording.path', '/').toString();
    requestOptions.protocol = this.configOption('remote_recording.protocol', 'http:').toString();

    return requestOptions;
  }

  locationString(): string {
    const ro = this.requestOptions();
    return `${ro.protocol}//${ro.hostname}:${ro.port}${ro.path}`;
  }

  private settingsKey() {
    return isAbsolute(this.appMapFile) ? this.appMapFile : join(process.cwd(), this.appMapFile);
  }

  protected appMapFile: string;
  protected settingsFile: string;
  private config?: Partial<AppMapConfig>;
  private settings?: Setting;
  private configDirty = false;
  private settingsDirty = false;
}

async function readConfig(path: string): Promise<AppMapConfig | undefined> {
  let fileContents: Buffer | undefined;
  try {
    fileContents = await readFile(path);
  } catch {
    return {} as AppMapConfig;
  }
  let config: AppMapConfig;
  try {
    config = load(fileContents.toString()) as AppMapConfig;
  } catch (err) {
    console.warn(`Error parsing AppMap config file ${path}: ${err}`);
    config = {} as AppMapConfig;
  }
  return config;
}

async function readAllSettings(path: string): Promise<AppMapSettings> {
  let settings: any;
  try {
    const fileContents = await readFile(path);
    settings = load(fileContents.toString()) as any;
    // Make sure settings is an object.
    settings['test'];
  } catch {
    settings = {};
  }
  return settings;
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

function mergeConfigData(data: any, path: string, value: string | number | TestCommand[]): void {
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
