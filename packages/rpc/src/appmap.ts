export namespace AppMapRpc {
  export namespace Stats {
    export namespace V1 {
      export const Method = 'v1.appmap.stats';
      export type Params = undefined;
      export type Response = {
        packages: string[];
        classes: string[];
        routes: string[];
        tables: string[];
        numAppMaps: number;
      };
    }

    export namespace V2 {
      export const Method = 'v2.appmap.stats';
      export type Params = undefined;
      export type Response = Array<
        Stats.V1.Response & {
          name?: string;
        }
      >;
    }
  }

  export const DataFunctionName = 'appmap.data';
  export const FilterFunctionName = 'appmap.filter';
  export const MetadataFunctionName = 'appmap.metadata';
  export const SequenceDiagramFunctionName = 'appmap.sequenceDiagram';

  export type FilterOptions = {
    appmap: string;
    filter?: string | Record<string, unknown>;
  };

  export type FilterResponse = Record<string, unknown>;

  export type MetadataOptions = {
    appmap: string;
  };

  export type MetadataResponse = Record<string, unknown>;

  export type SequenceDiagramOptions = {
    appmap: string;
    filter?: string | Record<string, unknown>;
    diagramOptions?: Record<string, unknown>;
    format?: string;
    formatOptions?: Record<string, unknown>;
  };

  export type SequenceDiagramResponse = Record<string, unknown> | string;
}
