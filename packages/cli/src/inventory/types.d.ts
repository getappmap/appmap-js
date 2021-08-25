export interface Dependency {
  caller: string;
  callee: string;
}

export interface Request {
  route: string;
  parameters: string[];
  status: number;
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
  stacks: string[][];
}
