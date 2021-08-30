export interface Dependency {
  caller: string;
  callee: string;
}

export interface Function {
  function: string;
}

export interface Labels {
  labels: string[];
}

export interface Query {
  query: string;
}

export interface Request {
  route: string;
  parameters: string[];
  status: number;
}

export interface Call extends Function, Labels, Query, Request {}

export interface Stack {
  functions: Call[];
}

export interface Inventory {
  packages: Set<string>;
  classes: Set<string>;
  labels: Set<string>;
  packageDependencies: Set<Dependency>;
  sqlTables: Set<string>;
  sqlNormalized: Set<string>;
  httpServerRequests: Set<Request>;
  httpClientRequests: Set<Request>;
  functionTrigrams: Stack[];
  stacks: Stack[];
}
