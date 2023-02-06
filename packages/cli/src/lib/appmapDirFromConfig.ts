import assert from 'assert';
import loadAppMapConfig from './loadAppMapConfig';

export async function appmapDirFromConfig(): Promise<string | undefined> {
  const appmapConfig = await loadAppMapConfig();
  if (appmapConfig) return appmapConfig.appmap_dir;
}

export function assertAppMapDir(appmapDir: string) {
  assert(appmapDir, 'appmapDir must be provided as a command option, or available in appmap.yml');
}
