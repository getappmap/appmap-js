export interface SQL {
  sql: string;
  database_type: string;
}

export interface HTTPServerRequest {
  path: string;
  normalized_path: string;
  headers: {string:string};
}

export interface Event {
  id: integer;
  type: string;
  definedClass: string;
  methodId: string;
  labels: Set;
  sql: SQL;
  httpServerRequest: HTTPServerRequest;
  sqlQuery: string;
  isFunction: bool;
  returnValue: any;
  callEvent: Event;
  returnEvent: Event;
  codeObject: CodeObject;
  isCall: function(): boolean;
  isReturn: function(): boolean;
}

export interface SQLInfo {
  tables: string[];
  columns: string[];
}

export interface CodeObject {
  id: string;
  name: string;
  type: string;
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
  match: function(CodeObject) : string;
  pop: function() : void;
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
  callers: Event[];
  ancestors: Event[];
  descendants: Event[];
  packageTrigrams: Trigram[];
  classTrigrams: Trigram[];
  functionTrigrams: Trigram[];
}