import { appmapDirFromConfig } from './appmapDirFromConfig';

export async function locateAppMapDir(appmapDir?: string): Promise<string> {
  if (appmapDir) return appmapDir;

  const result = await appmapDirFromConfig();
  if (!result)
    throw new Error('appmapDir must be provided as a command option, or available in appmap.yml');
  return result;
}
