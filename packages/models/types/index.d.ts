import type { SqliteParser } from './sqlite-parser';

declare module '@appland/models' {
  export type CodeObjectType =
    | 'package'
    | 'class'
    | 'function'
    | 'database'
    | 'query'
    | 'http'
    | 'route'
    | 'external-service';

  export interface ObjectBase {
    readonly class: string;
    readonly object_id?: number;
  }

  export interface ValueBase extends ObjectBase {
    readonly value: string;
    readonly size?: number;
    readonly properties?: ParameterProperty[];
  }

  export interface ParameterProperty {
    readonly name: string;
    readonly class: string;
  }

  export interface ParameterObject extends ValueBase {
    readonly name?: string;
  }

  export interface ExceptionObject extends ObjectBase {
    readonly message: string;
    readonly path?: string;
    readonly lineno?: number;
  }

  export interface ReturnValueObject extends ValueBase {}

  export interface HttpServerRequest {
    readonly headers?: Record<string, string>;
    readonly request_method: string;
    readonly path_info: string;
    readonly normalized_path_info?: string;
    readonly protocol?: string;
  }

  export interface HttpServerResponse {
    readonly status: number;
    readonly headers?: Record<string, string>;
  }

  export interface HttpClientRequest {
    readonly headers?: Record<string, string>;
    readonly request_method: string;
    readonly url: string;
  }

  export interface HttpClientResponse {
    readonly status: number;
    readonly headers?: Record<string, string>;
  }

  export interface SqlQuery {
    readonly database_type: string;
    readonly sql: string;
    readonly explain_sql?: string;
    readonly server_version?: string;
  }

  export type Label =
    | 'command'
    | 'log'
    | 'mvc.controller'
    | 'mvc.dao'
    | 'mvc.model'
    | 'mvc.template'
    | 'mvc.template.resolver'
    | 'mvc.view'
    | 'public'
    | 'rpc.circuit_breaker'
    | 'rpc.retry'
    | 'secret'
    | 'security.authentication'
    | 'security.authorization'
    | 'security.require_login'
    | string;

  export class CodeObject {
    readonly labels: Set<Label>;
    readonly children: CodeObject[];
    readonly parent?: CodeObject;
    readonly events: Event[];
    readonly id: string;
    readonly name: string;
    readonly type: CodeObjectType;
    readonly static: boolean;
    readonly location: string;
    readonly locations: string[];
    readonly packageOf: string;
    readonly classOf: string;
    readonly classObject?: CodeObject;
    readonly packageObject?: CodeObject;
    readonly functions: CodeObject[];
    readonly classes: CodeObject[];
    readonly allEvents: Event[];
    readonly inboundConnections: CodeObject[];
    readonly outboundConnections: CodeObject[];
    readonly sqlQueries: CodeObject[];
    readonly prettyName: string;
    readonly fqid: string;

    descendants: CodeObject[];
    ancestors: CodeObject[];
    leafs(): CodeObject[];
    childLeafs(): CodeObject[];
    visit(fn: (codeObject: CodeObject, stack: CodeObject[]) => void): void;
    buildId(): string;
    classLocations(): Set<string>;
    toJSON(): any;

    static constructDataChainFromEvent(event: Event): any[];
  }

  export class ClassMap {
    readonly codeObjectsByLocation: Map<string, CodeObject>;
    readonly codeObjectsById: Map<string, CodeObject>;
    readonly codeObjects: CodeObject[];
    readonly httpObject?: CodeObject;
    readonly sqlObject?: CodeObject;

    visit(fn: (codeObject: CodeObject) => void): void;
    search(query: string): CodeObject[];
    codeObjectFromId(id: string): CodeObject | undefined;
    codeObjectsAtLocation(location: string): CodeObject[];
    codeObjectFromEvent(event: Event): CodeObject | null;
    root(type: CodeObjectType): CodeObject | undefined;
    bindEvents(events: Event[]): void;
    toJSON(): any;
  }

  export class Event {
    readonly id: number;
    readonly path?: string;
    readonly lineno?: number;
    readonly receiver?: ValueBase;
    readonly depth: number;
    readonly methodId?: string;
    readonly isFunction: boolean;
    readonly isStatic: boolean;
    readonly sql?: SqlQuery;
    readonly returnValue?: ReturnValueObject;
    readonly children: readonly Event[];
    readonly httpServerRequest?: HttpServerRequest;
    readonly httpServerResponse?: HttpServerResponse;
    readonly httpClientRequest?: HttpClientRequest;
    readonly httpClientResponse?: HttpClientResponse;
    readonly elapsedTime?: number;
    readonly definedClass?: string | null;
    readonly requestPath?: string | null;
    readonly requestMethod?: string | null;
    readonly requestContentType?: string;
    readonly responseContentType?: string;
    readonly route?: string | null;
    readonly sqlQuery?: string | null;
    readonly fqid: string;
    readonly previousSibling?: Event | null;
    readonly nextSibling?: Event | null;
    readonly callEvent: Event;
    readonly returnEvent: Event;
    readonly stableProperties: Record<string, string | number>;
    readonly hash: string;
    readonly identityHash: string;
    readonly threadId: number;
    readonly parentId?: number;
    readonly elapsedInstrumentationTime?: number;

    constructor(data?: any);

    linkedEvent: Event;
    next?: Event;
    previous?: Event;
    parent?: Event;
    codeObject: CodeObject;
    parameters?: readonly ParameterObject[];
    labels: Set<string>;
    exceptions: readonly ExceptionObject[];
    message?: readonly ParameterObject[];

    link(event: Event): void;
    isCall(): boolean;
    isReturn(): boolean;
    callStack(): Event[];
    ancestors(): Event[];
    descendants(): Event[];
    traverse(fn: (event: Event) => void): void;
    traverse(handlers: { onEnter(event: Event): void; onExit(event: Event): void }): void;
    dataObjects(): Array<ParameterObject | ReturnValueObject>;
    toString(): string;
    toJSON(): any;
  }

  export class EventNavigator {
    constructor(event: Event);

    event: Event;
    self(): Generator<EventNavigator>;
    ancestors(): Generator<EventNavigator>;
    preceding(): Generator<EventNavigator>;
    following(): Generator<EventNavigator>;
    precedingSiblings(): Generator<EventNavigator>;
    followingSiblings(): Generator<EventNavigator>;
    descendants(): Generator<EventNavigator>;
  }

  export type LabelMap = Record<string, Record<CodeObjectType | 'event', Event | CodeObject>>;

  export class EventChangeSummary {
    added: Event[];
    removed: Event[];
    changed: Event[];
  }

  export interface Fingerprint {
    appmap_digest: string;
    canonicalization_algorithm: string;
    digest: string;
    fingerprint_algorithm: string;
  }

  export namespace Metadata {
    export class Client {
      name: string;
      url: string;
      version?: string;
    }

    export class Exception {
      class: string;
      message: string;
    }

    export class Framework {
      name: string;
      version: string;
    }

    export class Fingerprint {
      appmap_digest: string;
      canonicalization_algorithm: string;
      digest: string;
      fingerprint_algorithm: string;
    }

    export class Git {
      repository: string;
      branch: string;
      commit: string;
      status: string[];
      tag?: string;
      annotated_tag?: string;
      commits_since_tag?: number;
      commits_since_annotated_tag: number;
    }

    export class Language extends Framework {
      engine?: string;
    }

    export class Recorder {
      name: string;
    }
  }

  export class Metadata {
    name: string;
    labels?: string[];
    app?: string;
    client: Metadata.Client;
    fingerprints?: Metadata.Fingerprint[];
    frameworks?: Metadata.Framework[];
    git?: Metadata.Git;
    language?: Metadata.Language;
    recorder: Metadata.Recorder;
    testStatus?: 'succeeded' | 'failed';
    exception: Metadata.Exception;
  }

  export class AppMap {
    readonly version: string;
    readonly metadata: Metadata;
    readonly name: string;
    readonly rootEvent: Event;
    readonly events: readonly Event[];
    readonly classMap: ClassMap;
    readonly labels: LabelMap;

    static multiTreeIterator(
      baseAppMap: AppMap,
      workingAppMap: AppMap
    ): IterableIterator<[Event, Event]>;

    static getDiff(baseAppMap: AppMap, workingAppMap: AppMap): EventChangeSummary;

    rootEvents(): Event[];
    toJSON(): any;
  }

  export class AppMapBuilder {
    source(data: string | Record<string, unknown>): AppMapBuilder;
    event(transform: (event: Event) => Event): AppMapBuilder;
    stack(transform: (stack: Event[]) => Event[]): AppMapBuilder;
    chunk(transform: (chunk: Event[]) => Event[]): AppMapBuilder;
    normalize(): AppMapBuilder;
    prune(sizeBytes: number): AppMapBuilder;
    removeNoise(): AppMapBuilder;
    collectEvents(): Event[];
    build(): AppMap;
  }

  export type SQLAnalysis = {
    actions: string[];
    tables: string[];
    columns: string[];
    joinCount: number;
  };

  export class ParseError extends Error {}

  export type OnSQLParseError = (error: ParseError) => void;

  type IdentifiableCodeObject = {
    type: string;
    name: string;
    parent?: IdentifiableCodeObject;
  };

  export function codeObjectId(codeObject: IdentifiableCodeObject, tokens?: string[]): string[];

  export function abstractSqlAstJSON(sql: string, databaseType: string): string;
  export function analyzeSQL(sql: string, errorCallback: OnSQLParseError): SQLAnalysis;
  export function parseSQL(
    sql: string,
    errorCallback?: OnSQLParseError
  ): SqliteParser.ListStatement | null;
  export function normalizeSQL(sql: string, databaseType: string): string;

  export function buildAppMap(data?: string | Record<string, unknown>): AppMapBuilder;
}
