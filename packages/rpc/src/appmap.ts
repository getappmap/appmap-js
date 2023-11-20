export namespace AppMapRpc {
  export const FilterFunctionName = 'appmap.filter';

  export type FilterOptions = {
    appmap: string;
    filter: string | Record<string, any>;
  };

  export type FilterResponse = {
    appmap: Record<string, any>;
  };
}
