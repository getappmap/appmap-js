import { join } from 'path';
import { setConfigurationV2 } from '../rpc/configuration';

export function handleWorkingDirectory(directory?: string) {
  if (directory) process.chdir(directory);
}

export async function configureRpcDirectories(directory: string | string[]) {
  const directories = Array.isArray(directory) ? directory : [directory];
  const appmapConfigFiles = directories.map((dir) => join(dir, 'appmap.yml'));
  await setConfigurationV2().handler({ projectDirectories: directories, appmapConfigFiles });
}
