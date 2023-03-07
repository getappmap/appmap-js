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

export type Finding = {
  ruleId: string;
};

export type LogEntry = {
  stack: string[];
  message: string;
};

export type TestFailure = {
  appmapFile: string;
  name: string;
  testLocation?: string;
  logEntries: LogEntry[];
};

export type Changes = {
  routeChanges: RouteChanges;
  findings: Finding[];
  failedTests: TestFailure[];
};
