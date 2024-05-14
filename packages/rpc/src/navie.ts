export namespace NavieRpc {
  export namespace V1 {
    export namespace Commands {
      export const Method = 'v1.navie.commands';
      export type Params = {};
      export type Response = Array<{ command: string; description: string }>;
    }
  }
}
