import loadAppMapConfig from './loadAppMapConfig';

export async function appNameFromConfig(): Promise<string | undefined> {
  const appmapConfig = await loadAppMapConfig();
  if (appmapConfig) return appmapConfig.name;
}
