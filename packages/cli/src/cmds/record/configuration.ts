import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { RequestOptions } from 'http';
import { dump, load } from 'js-yaml';

let AppMapFile = 'appmap.yml';

export function setAppMapFile(appMapFile: string): void {
  AppMapFile = appMapFile;
  if (!existsSync(appMapFile)) {
    console.log(`Warning: AppMap config file ${appMapFile} does not exist.`);
  }
}

async function readConfig(): Promise<any | undefined> {
  let fileContents: Buffer | undefined;
  try {
    fileContents = await readFile(AppMapFile);
  } catch {
    return;
  }
  return load(fileContents.toString());
}

async function writeConfig(config: any): Promise<void> {
  await writeFile(AppMapFile, dump(config));
}

export async function requestOptions(): Promise<RequestOptions> {
  const requestOptions = {} as RequestOptions;

  requestOptions.hostname = (
    await readSetting('dev_server.host', 'localhost')
  ).toString();
  requestOptions.port = await readSetting('dev_server.port', 3000);
  requestOptions.path = (await readSetting('dev_server.path', '/')).toString();
  requestOptions.protocol = (
    await readSetting('dev_server.protocol', 'http:')
  ).toString();

  return requestOptions;
}

export async function readSetting(
  path: string,
  defaultValue: string | number
): Promise<string | number> {
  const config = await readConfig();
  if (!config) return defaultValue;

  const tokens = path.split('.');
  let entry = config;
  for (const token of tokens) {
    if (!entry) return defaultValue;
    entry = entry[token];
  }
  if (typeof entry === 'object') return defaultValue;

  return entry || defaultValue;
}

export async function writeSetting(path: string, value: string | number) {
  const config = await readConfig();
  if (!config) return;

  const tokens = path.split('.');
  const lastToken = tokens.pop()!;
  let entry = config;
  for (const token of tokens) {
    if (!entry[token]) {
      entry[token] = {};
    }
    entry = entry[token];
  }
  if (typeof entry === 'object') {
    if (entry[lastToken] !== value) {
      entry[lastToken] = value;
      writeConfig(config);
    }
  }
}
