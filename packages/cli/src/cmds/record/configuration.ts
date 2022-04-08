import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
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

  return entry;
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
