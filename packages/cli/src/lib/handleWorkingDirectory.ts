import { join } from "path";
import { setConfiguration } from "../rpc/configuration";

export function handleWorkingDirectory(directory?: string) {
  if (directory) process.chdir(directory);
}

export function configureRpcDirectories(directory: string | string[]) {
  const directories = Array.isArray(directory) ? directory : [directory];
  const appmapConfigFiles = directories.map((dir) => join(dir, 'appmap.yml'));
  setConfiguration().handler({ appmapConfigFiles });
}
