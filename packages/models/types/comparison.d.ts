declare module '@appland/models' {
  export const APPMAP_COMPARISON_KIND: 'appmap.comparison';
  export const APPMAP_COMPARISON_SCHEMA_VERSION: 1;
  export const APPMAP_COMPARISON_CHANGE_ID_VERSION: 1;

  export const comparisonViewIds: readonly ['dependency', 'sequence', 'trace', 'flame'];
  export type ComparisonViewId = (typeof comparisonViewIds)[number];

  export const behavioralChangeKinds: readonly [
    'call-added',
    'call-removed',
    'call-changed',
    'call-reordered',
    'query-added',
    'query-removed',
    'query-changed',
    'rpc-added',
    'rpc-removed',
    'rpc-changed',
    'dependency-added',
    'dependency-removed',
    'dependency-changed',
    'exception-added',
    'exception-removed',
    'exception-changed',
    'control-flow-added',
    'control-flow-removed',
    'control-flow-changed',
    'timing-changed',
    'unknown'
  ];
  export type BehavioralChangeKind = (typeof behavioralChangeKinds)[number];

  export type ComparisonValue =
    | null
    | boolean
    | number
    | string
    | ComparisonValue[]
    | { [key: string]: ComparisonValue };

  export type ComparisonValueChange = {
    before?: ComparisonValue;
    after?: ComparisonValue;
  };

  export type ComparisonReference = {
    eventIds?: number[];
    elementIds?: string[];
  };

  export type ComparisonViewReference = {
    base?: ComparisonReference;
    head?: ComparisonReference;
    diff?: ComparisonReference;
  };

  export type BehavioralChange = {
    id: string;
    kind: BehavioralChangeKind;
    summary: string;
    base?: ComparisonReference;
    head?: ComparisonReference;
    views: Partial<Record<ComparisonViewId, ComparisonViewReference>>;
    details?: Record<string, ComparisonValueChange>;
    labels?: string[];
  };

  export type ComparisonView<TPayload = unknown, TAlignment = unknown> = {
    schemaVersion: number;
    base: TPayload;
    head: TPayload;
    diff: TPayload;
    alignment: TAlignment;
  };

  export type ComparisonViewMap = Partial<Record<ComparisonViewId, ComparisonView>>;

  export type AppMapComparison<TViews extends ComparisonViewMap = ComparisonViewMap> = {
    kind: typeof APPMAP_COMPARISON_KIND;
    schemaVersion: typeof APPMAP_COMPARISON_SCHEMA_VERSION;
    producer: {
      name: string;
      version: string;
    };
    scenario: {
      id: string;
      name?: string;
    };
    revisions?: {
      base?: string;
      head?: string;
    };
    recordings: {
      base: string;
      head: string;
    };
    capabilities: {
      views: Partial<Record<ComparisonViewId, number>>;
      navigation?: {
        changes?: number;
        eventAlignment?: number;
      };
    };
    changes: BehavioralChange[];
    views: TViews;
    extensions?: Record<string, unknown>;
  };

  export const appMapComparisonSchema: Record<string, any>;

  export function canonicalComparisonIdentity(identity: unknown): string;
  export function makeComparisonChangeId(identity: unknown, occurrence?: number): string;
  export function validateAppMapComparison(value: unknown): string[];
  export function assertAppMapComparison(value: unknown): asserts value is AppMapComparison;
}
