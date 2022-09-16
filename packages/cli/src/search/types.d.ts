export interface SQL {
  sql: string;
  database_type: string;
}

export interface HTTPRoute {
  method: string;
  uri: string;
}

export interface HTTPRequest {
  route: HTTPRoute;
  parameterNames: string[];
  statusCode: number;
}

export interface HTTPServerRequest {
  path: string;
  normalized_path: string;
  headers: { string: string };
}

export interface Event {
  id: number;
  type: string;
  parent: Event;
  definedClass: string;
  methodId: string;
  labels: Set<string>;
  sql: SQL;
  httpServerRequest: HTTPServerRequest;
  sqlQuery: string;
  isFunction: boolean;
  returnValue: any;
  callEvent: Event;
  returnEvent: Event;
  codeObject: CodeObject;
  isCall: () => boolean;
  isReturn: () => boolean;
}

export interface SQLInfo {
  tables: string[];
  columns: string[];
}

export interface CodeObject {
  name: string;
  type: string;
  fqid: string;
  children?: CodeObject[];
  parent?: CodeObject;
  location?: string; // Functions only
  static?: boolean; // Functions only
}

export interface Trigram {
  callerId: string;
  codeObjectId: string;
  calleeId: string;

  id: string;
}

export interface CodeObjectMatcher {
  matchClassMap(classMap: CodeObject[]): CodeObject[];
}

export interface CodeObjectMatch {
  appmap: string;
  codeObject: CodeObject;
}

export interface EventMatch {
  appmap: string;
  event: Event;
  ancestors: Event[];
  descendants: Event[];
  caller: Event;
  packageTrigrams: Trigram[];
  classTrigrams: Trigram[];
  functionTrigrams: Trigram[];
}

export interface CodeObjectMatchSpec {
  tokens: Array<(codeObject: CodeObject) => boolean>;
}

export interface Filter {
  name: string;
  value: string;
}

export interface FunctionStats {
  eventMatches: EventMatch[];
  returnValues: string[];
  httpServerRequests: string[];
  sqlQueries: string[];
  sqlTables: string[];
  callers: string[];
  ancestors: string[];
  descendants: string[];
  packageTrigrams: Trigram[];
  classTrigrams: Trigram[];
  functionTrigrams: Trigram[];
}
