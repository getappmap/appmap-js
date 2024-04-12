import { ConfigurationRpc } from '@appland/rpc';
import { RpcHandler } from './rpc';
import { dirname } from 'path';
import loadAppMapConfig, { AppMapConfig } from '../lib/loadAppMapConfig';
import { getLLMConfiguration } from './llmConfiguration';

export type AppMapDirectory = {
  directory: string;
  appmapConfig: AppMapConfig;
};

export class Configuration {
  constructor(public projectDirectories: string[], public appmapConfigFilePaths: string[]) {}

  async appmapDirectories(): Promise<AppMapDirectory[]> {
    const appmapDirectories = new Array<AppMapDirectory>();
    for (const appmapConfigFile of this.appmapConfigFilePaths) {
      const directory = dirname(appmapConfigFile);
      const appmapConfig = await loadAppMapConfig(appmapConfigFile);
      if (appmapConfig) appmapDirectories.push({ directory, appmapConfig });
    }
    return appmapDirectories;
  }

  static async buildFromRpcParams(params: ConfigurationRpc.V2.Set.Params): Promise<Configuration> {
    return new Configuration(params.projectDirectories || [], params.appmapConfigFiles || []);
  }
}

let config = new Configuration([], []);

export default function configuration(): Configuration {
  return config;
}

export function setConfigurationV1(): RpcHandler<
  ConfigurationRpc.V1.Set.Params,
  ConfigurationRpc.V1.Set.Response
> {
  return {
    name: ConfigurationRpc.V1.Set.Method,
    handler: async ({ appmapConfigFiles }) => {
      // For V1, the project directories will be inferred from the available appmap.yml files.
      // Each appmap.yml file is assumed to be in the root of a project directory.
      const projectDirectories = appmapConfigFiles.map((file) => dirname(file));
      config = await Configuration.buildFromRpcParams({
        appmapConfigFiles,
        projectDirectories,
      });
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
    handler: () => {
      return {
        appmapConfigFiles: config.appmapConfigFilePaths,
      };
    },
  };
}

export function setConfigurationV2(): RpcHandler<
  ConfigurationRpc.V2.Set.Params,
  ConfigurationRpc.V2.Set.Response
> {
  return {
    name: ConfigurationRpc.V2.Set.Method,
    handler: async (params) => {
      config = await Configuration.buildFromRpcParams(params);
      return undefined;
    },
  };
}

export function getConfigurationV2(): RpcHandler<
  ConfigurationRpc.V2.Get.Params,
  ConfigurationRpc.V2.Get.Response
> {
  return {
    name: ConfigurationRpc.V2.Get.Method,
    handler: () => ({
      appmapConfigFiles: config.appmapConfigFilePaths,
      projectDirectories: config.projectDirectories,
      ...getLLMConfiguration(),
    }),
  };
}
