import { join } from 'path';

export function handleWorkingDirectory(directory?: string) {
  if (directory) process.chdir(directory);
}

export async function configureRpcDirectories(directory: string | string[]) {
  // Loaded here rather than at the top: the RPC configuration pulls in the
  // whole Navie package, and most commands only need handleWorkingDirectory.
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const configuration = require('../rpc/configuration') as typeof import('../rpc/configuration');

  const directories = Array.isArray(directory) ? directory : [directory];
  const appmapConfigFiles = directories.map((dir) => join(dir, 'appmap.yml'));
  await configuration
    .setConfigurationV2()
    .handler({ projectDirectories: directories, appmapConfigFiles });
}
