import loadAppMapConfig, { AppMapConfig } from "./loadAppMapConfig";
import { locateAppMapConfigFile } from "./locateAppMapConfigFile";

export default async function collectAppMapConfigByPath(
  appMapDirectories: string[]
): Promise<Map<string, AppMapConfig>> {
  const appMapConfigByPath = new Map<string, AppMapConfig>();
  for (const directory of appMapDirectories) {
    const appmapConfigFile = await locateAppMapConfigFile(directory);
    if (!appmapConfigFile) {
      console.warn(`No AppMap config file found in directory: ${directory}`);
      continue;
    }

    const appmapConfig = await loadAppMapConfig(appmapConfigFile);
    if (!appmapConfig) {
      console.warn(`No AppMap config found at ${appmapConfigFile}`);
    } else {
      appMapConfigByPath.set(directory, appmapConfig);
      break;
    }
  }

  console.warn(
    `AppMap config files found in the following directories: ${Array.from(
      appMapConfigByPath.keys()
    ).join(', ')}`
  );

  return appMapConfigByPath;
}
