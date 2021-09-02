import { string } from 'yargs';

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

  export abstract class ObjectBase {
    readonly class: string;
    readonly object_id?: number;
  }

  export class ParameterObject extends ObjectBase {
    readonly name?: string;
    readonly value: string;
  }

  export class ExceptionObject extends ObjectBase {
    readonly message: string;
    readonly path?: string;
    readonly lineno?: number;
  }

  export class ReturnValueObject extends ObjectBase {
    readonly return_value?: string;
    readonly exceptions?: readonly ExceptionObject[];
  }

  export class HttpServerRequest {
    readonly headers?: Record<string, string>;
    readonly authorization?: string;
    readonly mime_type?: string;
    readonly request_method: string;
    readonly path_info: string;
    readonly normalized_path_info?: string;
    readonly protocol?: string;
  }

  export class HttpServerResponse {
    readonly status_code: number;
    readonly mime_type?: string;
  }

  export class HttpClientRequest {
    readonly headers?: Record<string, string>;
    readonly request_method: string;
    readonly url: string;
  }

  export class HttpClientResponse {
    readonly status_code: number;
    readonly mime_type?: string;
    readonly headers?: Record<string, string>;
  }

  export class SqlQuery {
    readonly database_type: string;
    readonly sql: string;
    readonly explain_sql?: string;
    readonly server_version?: string;
  }

  export class CodeObject {
    readonly labels: Set<string>;
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
    readonly receiver?: ParameterObject;
    readonly depth: number;
    readonly methodId?: string;
    readonly isFunction: boolean;
    readonly isStatic: boolean;
    readonly sql?: SqlQuery;
    readonly returnValue: ReturnValueObject;
    readonly children: readonly Event[];
    readonly httpServerRequest?: HttpServerRequest;
    readonly httpServerResponse?: HttpServerResponse;
    readonly httpClientRequest?: HttpClientRequest;
    readonly httpClientResponse?: HttpClientResponse;
    readonly elapsedTime?: number;
    readonly definedClass?: string | null;
    readonly requestPath?: string | null;
    readonly requestMethod?: string | null;
    readonly route?: string | null;
    readonly sqlQuery?: string | null;
    readonly fqid: string;
    readonly previousSibling?: Event | null;
    readonly nextSibling?: Event | null;
    readonly callEvent: Event;
    readonly returnEvent: Event;
    readonly hash: string;
    readonly identityHash: string;

    linkedEvent: Event;
    next?: Event;
    previous?: Event;
    parent?: Event;
    codeObject: CodeObject;
    parameters?: readonly ParameterObject[];
    labels: Set<string>;
    exceptions: readonly ExceptionObject[];
    message?: readonly ParameterObject[];

    link(Event: Event): void;
    isCall(): boolean;
    isReturn(): boolean;
    callStack(): Event[];
    ancestors(): Event[];
    descendants(): Event[];
    traverse(
      fn: (event: Event) => void | { onEnter(event: Event): void; onExit(event: Event): void }
    ): void;
    dataObjects(): Array<ParameterObject | ReturnValueObject>;
    toString(): string;
    toJSON(): any;
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

  export class Metadata {
    name: string;
    fingerprints?: Fingerprint[];
  }

  export class AppMap {
    readonly version: string;
    readonly metadata: Metadata & any;
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

  export function buildAppMap(data?: string | Record<string, unknown>): AppMapBuilder;
}
