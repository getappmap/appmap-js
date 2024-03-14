import { ConfigurationRpc } from '@appland/rpc';
import { RpcHandler } from './rpc';
import { dirname, join } from 'path';
import loadAppMapConfig, { AppMapConfig } from '../lib/loadAppMapConfig';

export type AppMapConfigWithDirectory = AppMapConfig & {
  directory: string;
};

export class Configuration {
  constructor(public appmapConfigFiles: string[] = []) {}

  get directories() {
    return this.appmapConfigFiles.map(dirname);
  }

  async appmapDirs(): Promise<string[]> {
    return (
      await Promise.all(
        this.appmapConfigFiles.map(async (file) => {
          const appmapDir = (await loadAppMapConfig(file))?.appmap_dir;
          if (appmapDir) return join(dirname(file), appmapDir);
        })
      )
    ).filter(Boolean) as string[];
  }

  async configs(): Promise<AppMapConfigWithDirectory[]> {
    return (
      await Promise.all(
        this.appmapConfigFiles.map(async (file) => {
          const config = await loadAppMapConfig(file);
          if (config) return { ...config, directory: dirname(file) };
        })
      )
    ).filter(Boolean) as AppMapConfigWithDirectory[];
  }
}

let config = new Configuration();

export default function configuration(): Configuration {
  return config;
}

export function setConfigurationV1(): RpcHandler<
  ConfigurationRpc.V1.Set.Params,
  ConfigurationRpc.V1.Set.Response
> {
  return {
    name: ConfigurationRpc.V1.Set.Method,
    handler: ({ appmapConfigFiles }) => {
      config = new Configuration(appmapConfigFiles);
      return undefined;
    },
  };
}

export function getConfigurationV1(): RpcHandler<
  ConfigurationRpc.V1.Get.Params,
  ConfigurationRpc.V1.Get.Response
> {
  return {
    name: ConfigurationRpc.V1.Get.Method,
    handler: () => ({ appmapConfigFiles: config.appmapConfigFiles }),
  };
}
