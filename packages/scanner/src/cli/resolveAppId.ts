import { App } from '@appland/client/dist/src';
import { constants as fsConstants } from 'fs';
import { access, readFile } from 'fs/promises';
import { load } from 'js-yaml';
import { dirname, join, resolve } from 'path';
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
  appMapDir: string | undefined,
  mustExist = false
): Promise<string | undefined> {
  const appId = await resolveAppId(appIdArg, appMapDir);
  if (!appId) throw new ValidationError('App was not provided and could not be resolved');

  const appExists = await new App(appId).exists();
  if (!appExists) {
    if (mustExist) {
      throw new ValidationError(
        `App "${appId}" is not valid or does not exist. Please fix the app name in the appmap.yml file, or override it with the --app option.`
      );
    }
    console.warn(
      `App "${appId}" does not exist on the AppMap Server. If this is unexpected, provide the correct app name in the appmap.yml file, or override it with the --app option.`
    );
    return;
  }

  return appId;
}
