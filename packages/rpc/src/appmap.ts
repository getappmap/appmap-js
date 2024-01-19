export namespace AppMapRpc {
  export const StatsFunctionName = 'appmap.stats';
  export const DataFunctionName = 'appmap.data';
  export const FilterFunctionName = 'appmap.filter';
  export const MetadataFunctionName = 'appmap.metadata';
  export const SequenceDiagramFunctionName = 'appmap.sequenceDiagram';

  export type StatsOptions = {};

  export type StatsResponse = {
    packages: string[];
    classes: string[];
    routes: string[];
    tables: string[];
    numAppMaps: number;
  };

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
