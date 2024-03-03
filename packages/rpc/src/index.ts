export namespace IndexRpc {
  export const NumProcessedFunctionName = 'index.numProcessed';

  export type NumProcessedOptions = {};

  export type NumProcessedResponse = number;
}

export * from './search';
export * from './appmap';
export * from './explain';
export * from './navie';
