export namespace AppMapRpc {
  export const DataFunctionName = 'appmap.data';
  export const FilterFunctionName = 'appmap.filter';
  export const MetadataFunctionName = 'appmap.metadata';
  export const SequenceDiagramFunctionName = 'appmap.sequenceDiagram';

  export type FilterOptions = {
    appmap: string;
    filter: string | Record<string, unknown>;
  };

  export type FilterResponse = Record<string, any>;

  export type MetadataOptions = {
    appmap: string;
  };

  export type MetadataResponse = Record<string, unknown>;

  export type SequenceDiagramOptions = {
    appmap: string;
    filter?: string | Record<string, string | boolean | string[]>;
    diagramOptions?: Record<string, any>;
    format?: string;
    formatOptions?: Record<string, string | boolean>;
  };

  export type SequenceDiagramResponse = Record<string, unknown> | string;
}
