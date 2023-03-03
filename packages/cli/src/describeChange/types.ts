import { Diagram as SequenceDiagram } from '@appland/sequence-diagram';

export type Operation = {
  method: string;
  path: string;
  status: number;
};

export type OperationChange = {
  operation: Operation;
  sourceDiff?: string | undefined;
  sequenceDiagrams?: SequenceDiagram[];
};

export type RouteChanges = {
  added: OperationChange[];
  removed: OperationChange[];
  changed: OperationChange[];
};

export type Changes = {
  routeChanges: RouteChanges;
};
