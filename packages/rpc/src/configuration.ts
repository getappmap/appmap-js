export namespace ConfigurationRpc {
  export namespace V1 {
    export namespace Set {
      export const Method = 'v1.configuration.set';
      export type Params = {
        appmapConfigFiles: string[];
      };
      export type Response = void;
    }

    export namespace Get {
      export const Method = 'v1.configuration.get';
      export type Params = undefined;
      export type Response = {
        appmapConfigFiles: string[];
      };
    }
  }

  export namespace V2 {
    export namespace Set {
      export const Method = 'v2.configuration.set';
      export type Params = V1.Set.Params & {
        projectDirectories: string[];
      };
      export type Response = void;
    }

    export namespace Get {
      export const Method = 'v2.configuration.get';
      export type Params = undefined;
      export type Response = V1.Get.Response & {
        projectDirectories: string[];
        baseUrl?: string;
        model?: string;
      };
    }
  }
}
