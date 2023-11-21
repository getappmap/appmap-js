export namespace AppMapRpc {
  export const FilterFunctionName = 'appmap.filter';
  export const MetadataFunctionName = 'appmap.metadata';

  export type FilterOptions = {
    appmap: string;
    filter: string | Record<string, any>;
  };

  export type FilterResponse = {
    appmap: Record<string, any>;
  };

  export type MetadataOptions = {
    appmap: string;
  };

  export type MetadataResponse = Record<string, any>;
}
