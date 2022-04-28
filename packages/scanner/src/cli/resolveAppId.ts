import { constants as fsConstants } from 'fs';
import { access, readFile } from 'fs/promises';
import { load } from 'js-yaml';
import { dirname, join, resolve } from 'path';
import { exists } from '../integration/appland/app/exists';
import { ValidationError } from '../errors';

async function resolveAppId(
  appIdArg: string | undefined,
  appMapDir: string | undefined
): Promise<string | undefined> {
  if (appIdArg) {
    return appIdArg;
  }

  if (appMapDir) {
    let searchPath = resolve(appMapDir);
    while (searchPath !== '/' && searchPath !== '.') {
      const configPath = join(searchPath, 'appmap.yml');

      try {
        await access(configPath, fsConstants.R_OK);
      } catch {
        searchPath = dirname(searchPath);
        continue;
      }

      const configContent = await readFile(configPath, 'utf-8');
      const config = load(configContent) as { name?: string };
      if (config.name) return config.name;
    }
  }
}

export default async function (
  appIdArg: string | undefined,
  appMapDir: string | undefined
): Promise<string> {
  const appId = await resolveAppId(appIdArg, appMapDir);
  if (!appId) throw new ValidationError('App was not provided and could not be resolved');

  const appExists = await exists(appId);
  if (!appExists) {
    throw new ValidationError(
      `App "${appId}" is not valid or does not exist.\nPlease fix the app name in the appmap.yml file, or override it with the --app option.`
    );
  }

  return appId;
}
