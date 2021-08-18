export interface SQL {
  sql: string;
  database_type: string;
}
 
export interface HTTPServerRequest {
  request_method: string;
  path_info: string;
  normalized_path_info: string;
  status_code: integer;
  headers: {string:string};
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
  id: string;
  name: string;
  type: string;
  database_type: string;
  children: CodeObject[];
  parent: CodeObject;
  location: string; // Functions only
  static: boolean; // Functions only
}

export interface Trigram {
  callerId: string;
  codeObjectId: string;
  calleeId: string;

  id: string;
}

export interface CodeObjectMatcher {
  match: (CodeObject) => string;
  pop: () => void;
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

export interface Reference {
  type: string;
  name: string;
}

export interface FunctionStats {
  references: Reference[];
  eventMatches: EventMatch[];
  returnValues: string[];
  httpServerRequests: string[];
  sqlQueries: string[];
  sqlTables: string[];
  callers: Event[];
  ancestors: Event[];
  descendants: Event[];
  packageTrigrams: Trigram[];
  classTrigrams: Trigram[];
  functionTrigrams: Trigram[];
}
