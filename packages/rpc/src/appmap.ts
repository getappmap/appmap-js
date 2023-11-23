export namespace AppMapRpc {
  export const FilterFunctionName = 'appmap.filter';
  export const MetadataFunctionName = 'appmap.metadata';
  export const SequenceDiagramFunctionName = 'appmap.sequenceDiagram';

  export type FilterOptions = {
    appmap: string;
    filter: string | Record<string, any>;
  };

  export type FilterResponse = Record<string, any>;

  export type MetadataOptions = {
    appmap: string;
  };

  export type MetadataResponse = Record<string, any>;

  export type SequenceDiagramOptions = {
    appmap: string;
    filter?: string | Record<string, any>;
    options?: Record<string, any>;
    format?: string;
    formatOptions?: Record<string, any>;
  };

  export type SequenceDiagramResponse = Record<string, any> | string;
}
