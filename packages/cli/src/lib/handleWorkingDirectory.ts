import { join } from 'path';
import { setConfigurationV1 } from '../rpc/configuration';

export function handleWorkingDirectory(directory?: string) {
  if (directory) process.chdir(directory);
}

export function configureRpcDirectories(directory: string | string[]) {
  const directories = Array.isArray(directory) ? directory : [directory];
  const appmapConfigFiles = directories.map((dir) => join(dir, 'appmap.yml'));
  setConfigurationV1().handler({ appmapConfigFiles });
}
