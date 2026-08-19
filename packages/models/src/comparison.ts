import sha256 from 'crypto-js/sha256.js';

import comparisonSchema from '../schema/comparison.schema.json';

export const APPMAP_COMPARISON_KIND = 'appmap.comparison' as const;
export const APPMAP_COMPARISON_SCHEMA_VERSION = 1 as const;
export const APPMAP_COMPARISON_CHANGE_ID_VERSION = 1 as const;

export const comparisonViewIds = ['dependency', 'sequence', 'trace', 'flame'] as const;
export type ComparisonViewId = (typeof comparisonViewIds)[number];

export const behavioralChangeKinds = [
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
  'unknown',
] as const;
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

export const appMapComparisonSchema = comparisonSchema;

const changeKinds = new Set<string>(behavioralChangeKinds);
const viewIds = new Set<string>(comparisonViewIds);
const changeIdPattern = /^chg_[0-9a-f]{20}(?:_[2-9][0-9]*|_[1-9][0-9]+)?$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function canonicalize(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;

  switch (typeof value) {
    case 'boolean':
    case 'number':
    case 'string':
      return JSON.stringify(value);
    case 'object': {
      const record = value as Record<string, unknown>;
      return `{${Object.keys(record)
        .filter((key) => record[key] !== undefined)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
        .join(',')}}`;
    }
    default:
      throw new TypeError(`Comparison identities cannot contain ${typeof value}`);
  }
}

/**
 * Canonical JSON representation used by every comparison producer before hashing a
 * behavioral change identity. Object key order never affects the result.
 */
export function canonicalComparisonIdentity(identity: unknown): string {
  return canonicalize(identity);
}

/**
 * Create an opaque, deterministic change id. `occurrence` disambiguates repeated,
 * otherwise-identical changes while keeping unrelated earlier changes from renumbering it.
 */
export function makeComparisonChangeId(identity: unknown, occurrence = 0): string {
  if (!Number.isInteger(occurrence) || occurrence < 0)
    throw new RangeError('occurrence must be a non-negative integer');

  const digest = sha256(canonicalComparisonIdentity(identity)).toString().slice(0, 20);
  return `chg_${digest}${occurrence === 0 ? '' : `_${occurrence + 1}`}`;
}

function validateString(value: unknown, path: string, errors: string[]): value is string {
  if (typeof value === 'string' && value.length > 0) return true;
  errors.push(`${path} must be a non-empty string`);
  return false;
}

function validatePositiveIntegerArray(value: unknown, path: string, errors: string[]): boolean {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return false;
  }

  const valid = value.every((item) => Number.isInteger(item) && item > 0);
  if (!valid) errors.push(`${path} must contain positive integers`);
  if (new Set(value).size !== value.length) errors.push(`${path} must contain unique values`);
  return valid;
}

function validateStringArray(value: unknown, path: string, errors: string[]): boolean {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return false;
  }

  const valid = value.every((item) => typeof item === 'string' && item.length > 0);
  if (!valid) errors.push(`${path} must contain non-empty strings`);
  if (new Set(value).size !== value.length) errors.push(`${path} must contain unique values`);
  return valid;
}

function validateReference(value: unknown, path: string, errors: string[]): boolean {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return false;
  }

  let hasReference = false;
  if (value.eventIds !== undefined) {
    hasReference = true;
    validatePositiveIntegerArray(value.eventIds, `${path}.eventIds`, errors);
  }
  if (value.elementIds !== undefined) {
    hasReference = true;
    validateStringArray(value.elementIds, `${path}.elementIds`, errors);
  }
  if (!hasReference) errors.push(`${path} must contain eventIds or elementIds`);
  return hasReference;
}

function validateViewReference(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  const references = ['base', 'head', 'diff'].filter((side) => value[side] !== undefined);
  if (references.length === 0) errors.push(`${path} must reference base, head, or diff`);
  references.forEach((side) => validateReference(value[side], `${path}.${side}`, errors));
}

function validateChange(
  value: unknown,
  path: string,
  availableViews: Set<string>,
  ids: Set<string>,
  errors: string[]
): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  if (!validateString(value.id, `${path}.id`, errors)) return;
  if (!changeIdPattern.test(value.id)) errors.push(`${path}.id has an unsupported format`);
  if (ids.has(value.id)) errors.push(`${path}.id must be unique`);
  ids.add(value.id);

  if (typeof value.kind !== 'string' || !changeKinds.has(value.kind))
    errors.push(`${path}.kind is unsupported`);
  validateString(value.summary, `${path}.summary`, errors);

  if (value.base !== undefined) validateReference(value.base, `${path}.base`, errors);
  if (value.head !== undefined) validateReference(value.head, `${path}.head`, errors);

  if (typeof value.kind === 'string') {
    if (value.kind.endsWith('-added') && value.head === undefined)
      errors.push(`${path}.head is required for an added change`);
    if (value.kind.endsWith('-removed') && value.base === undefined)
      errors.push(`${path}.base is required for a removed change`);
    if ((value.kind.endsWith('-changed') || value.kind.endsWith('-reordered')) &&
        (value.base === undefined || value.head === undefined))
      errors.push(`${path}.base and ${path}.head are required for changed/reordered changes`);
  }

  if (!isRecord(value.views) || Object.keys(value.views).length === 0) {
    errors.push(`${path}.views must contain at least one view reference`);
  } else {
    Object.entries(value.views).forEach(([viewId, reference]) => {
      if (!viewIds.has(viewId)) errors.push(`${path}.views.${viewId} is unsupported`);
      if (!availableViews.has(viewId))
        errors.push(`${path}.views.${viewId} does not have a corresponding bundle view`);
      validateViewReference(reference, `${path}.views.${viewId}`, errors);
    });
  }

  if (value.labels !== undefined) validateStringArray(value.labels, `${path}.labels`, errors);
  if (value.details !== undefined && !isRecord(value.details))
    errors.push(`${path}.details must be an object`);
}

function validateDiagram(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (!Array.isArray(value.actors)) errors.push(`${path}.actors must be an array`);
  if (!Array.isArray(value.rootActions)) errors.push(`${path}.rootActions must be an array`);
}

/** Return all contract violations. An empty result means the bundle is valid. */
export function validateAppMapComparison(value: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return ['$ must be an object'];

  if (value.kind !== APPMAP_COMPARISON_KIND)
    errors.push(`$.kind must be ${APPMAP_COMPARISON_KIND}`);
  if (value.schemaVersion !== APPMAP_COMPARISON_SCHEMA_VERSION)
    errors.push(`$.schemaVersion must be ${APPMAP_COMPARISON_SCHEMA_VERSION}`);

  if (!isRecord(value.producer)) errors.push('$.producer must be an object');
  else {
    validateString(value.producer.name, '$.producer.name', errors);
    validateString(value.producer.version, '$.producer.version', errors);
  }

  if (!isRecord(value.scenario)) errors.push('$.scenario must be an object');
  else {
    validateString(value.scenario.id, '$.scenario.id', errors);
    if (value.scenario.name !== undefined)
      validateString(value.scenario.name, '$.scenario.name', errors);
  }

  if (value.revisions !== undefined) {
    if (!isRecord(value.revisions)) errors.push('$.revisions must be an object');
    else {
      if (value.revisions.base !== undefined)
        validateString(value.revisions.base, '$.revisions.base', errors);
      if (value.revisions.head !== undefined)
        validateString(value.revisions.head, '$.revisions.head', errors);
    }
  }

  if (!isRecord(value.recordings)) errors.push('$.recordings must be an object');
  else {
    validateString(value.recordings.base, '$.recordings.base', errors);
    validateString(value.recordings.head, '$.recordings.head', errors);
  }

  const availableViews = new Set<string>();
  if (!isRecord(value.views) || Object.keys(value.views).length === 0) {
    errors.push('$.views must contain at least one view');
  } else {
    Object.entries(value.views).forEach(([viewId, view]) => {
      if (!viewIds.has(viewId)) errors.push(`$.views.${viewId} is unsupported`);
      availableViews.add(viewId);
      if (!isRecord(view)) {
        errors.push(`$.views.${viewId} must be an object`);
        return;
      }
      if (!Number.isInteger(view.schemaVersion) || Number(view.schemaVersion) < 1)
        errors.push(`$.views.${viewId}.schemaVersion must be a positive integer`);
      if (viewId === 'sequence') {
        validateDiagram(view.base, '$.views.sequence.base', errors);
        validateDiagram(view.head, '$.views.sequence.head', errors);
        validateDiagram(view.diff, '$.views.sequence.diff', errors);
        if (!isRecord(view.alignment)) errors.push('$.views.sequence.alignment must be an object');
        else validateStringArray(view.alignment.actorOrder, '$.views.sequence.alignment.actorOrder', errors);
      }
    });
  }

  if (!isRecord(value.capabilities)) errors.push('$.capabilities must be an object');
  else if (!isRecord(value.capabilities.views) || Object.keys(value.capabilities.views).length === 0)
    errors.push('$.capabilities.views must contain at least one view capability');
  else {
    Object.entries(value.capabilities.views).forEach(([viewId, version]) => {
      if (!viewIds.has(viewId)) errors.push(`$.capabilities.views.${viewId} is unsupported`);
      if (!Number.isInteger(version) || Number(version) < 1)
        errors.push(`$.capabilities.views.${viewId} must be a positive integer`);
      const view = isRecord(value.views) ? value.views[viewId] : undefined;
      if (!isRecord(view)) errors.push(`$.capabilities.views.${viewId} has no corresponding view`);
      else if (view.schemaVersion !== version)
        errors.push(`$.capabilities.views.${viewId} must match the view schemaVersion`);
    });
  }

  if (!Array.isArray(value.changes)) errors.push('$.changes must be an array');
  else {
    const ids = new Set<string>();
    value.changes.forEach((change, index) =>
      validateChange(change, `$.changes[${index}]`, availableViews, ids, errors)
    );
  }

  return errors;
}

export function assertAppMapComparison(value: unknown): asserts value is AppMapComparison {
  const errors = validateAppMapComparison(value);
  if (errors.length > 0)
    throw new TypeError(`Invalid AppMap comparison bundle:\n- ${errors.join('\n- ')}`);
}
