import { constants as fsConstants } from 'fs';
import { access, readFile } from 'fs/promises';
import { load } from 'js-yaml';
import { dirname, join, resolve } from 'path';
import { ValidationError } from '../errors';

export default async function (
  appIdArg: string | undefined,
  appMapDir: string | undefined
): Promise<string> {
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

  throw new ValidationError('app id was not provided and could not be resolved');
}
