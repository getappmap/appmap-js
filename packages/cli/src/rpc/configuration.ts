import { ConfigurationRpc } from '@appland/rpc';
import { RpcHandler } from './rpc';
import { dirname, join } from 'path';
import loadAppMapConfig from '../lib/loadAppMapConfig';

export class Configuration {
  constructor(public configurationData: ConfigurationRpc.Configuration) {}

  get directories() {
    return this.configurationData.appmapConfigFiles.map(dirname);
  }

  async appmapDirs(): Promise<string[]> {
    return (
      await Promise.all(
        this.configurationData.appmapConfigFiles.map(async (file) => {
          const appmapDir = (await loadAppMapConfig(file))?.appmap_dir;
          if ( appmapDir ) return join(dirname(file), appmapDir);
        })
      )
    ).filter(Boolean) as string[];
  }
}

let config = new Configuration({ appmapConfigFiles: [] });

export default function configuration(): Configuration {
  return config;
}

export function setConfiguration(): RpcHandler<ConfigurationRpc.Configuration, {}> {
  return {
    name: ConfigurationRpc.SetFunctionName,
    handler: (args) => {
      config = new Configuration(args);
      return {};
    },
  };
}

export function getConfiguration(): RpcHandler<{}, ConfigurationRpc.Configuration> {
  return {
    name: ConfigurationRpc.GetFunctionName,
    handler: () => config.configurationData,
  };
}
