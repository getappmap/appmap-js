import {
  HttpClientRequest,
  HttpClientResponse,
  HttpServerRequest,
  HttpServerResponse,
  ReturnValueObject,
  SqlQuery,
} from '@appland/models';

export class Fqid {
  constructor(public type: string, public id: string) {}
  toString(): string {
    return [this.type, this.id].join(':');
  }
}

export interface IndexEvent {
  fqid: Fqid;
  codeObjectIds: Fqid[];
  isFunction: boolean;
  labels: Set<string>;
  sql: SqlQuery;
  httpServerRequest: HttpServerRequest;
  httpServerResponse: HttpServerResponse;
  httpClientRequest: HttpClientRequest;
  httpClientResponse: HttpClientResponse;
  returnValue: ReturnValueObject;
}

export interface SQLInfo {
  tables: string[];
  columns: string[];
}

// CodeObject as represented in the AppMap index file classMap.json,
// as opposed to the 'classMap' entry in the complete AppMap.
export interface IndexCodeObject {
  id: string;
  fqid: string;
  name: string;
  type: string;
  children?: IndexCodeObject[];
  parent?: IndexCodeObject;
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
  matchClassMap(classMap: IndexCodeObject[]): IndexCodeObject[];
}

export interface CodeObjectMatch {
  appmap: string;
  codeObject: IndexCodeObject;
}

export interface EventMatch {
  appmap: string;
  event: IndexEvent;
  caller: IndexEvent;
  ancestors: IndexEvent[];
  sqlQueries: IndexEvent[];
  httpClientRequests: IndexEvent[];
  packageTrigrams: Trigram[];
  classTrigrams: Trigram[];
  functionTrigrams: Trigram[];
}

export interface CodeObjectMatchSpec {
  tokens: Array<(codeObject: IndexCodeObject) => boolean>;
}

export interface Filter {
  name: string;
  value: string;
}
