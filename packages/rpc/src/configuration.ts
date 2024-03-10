export namespace ConfigurationRpc {
  export const SetFunctionName = 'configuration.set';
  export const GetFunctionName = 'configuration.get';

  export type Configuration = {
    appmapConfigFiles: string[];
  };
}
