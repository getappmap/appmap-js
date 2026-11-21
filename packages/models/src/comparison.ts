import sha256 from 'crypto-js/sha256.js';

import comparisonSchema from '../schema/comparison.schema.json';
import { canonicalComparisonIdentity } from './comparisonIdentity';
import { validateSequenceView, validateSequenceReferences } from './comparisonSequence';
export {
  canonicalComparisonIdentity,
  COMPARISON_IDENTITY_MAX_DEPTH,
  COMPARISON_IDENTITY_MAX_NODES,
} from './comparisonIdentity';
export type {
  ComparisonSequenceActor,
  ComparisonSequenceAction,
  ComparisonSequenceDiagram,
  ComparisonSequenceView,
} from './comparisonSequenceTypes';

export const APPMAP_COMPARISON_KIND = 'appmap.comparison' as const;
export const APPMAP_COMPARISON_SCHEMA_VERSION = 1 as const;
export const APPMAP_COMPARISON_CHANGE_ID_VERSION = 1 as const;
export const APPMAP_COMPARISON_CHANGE_ID_PATTERN =
  '^chg_[0-9a-f]{20}(?:_(?:[2-9]|[1-9][0-9]+))?$' as const;

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
const changeIdPattern = new RegExp(APPMAP_COMPARISON_CHANGE_ID_PATTERN);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isComparisonValue(value: unknown): value is ComparisonValue {
  try {
    canonicalComparisonIdentity(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create an opaque, deterministic change id. `occurrence` disambiguates repeated,
 * otherwise-identical changes while keeping unrelated earlier changes from renumbering it.
 */
export function makeComparisonChangeId(identity: unknown, occurrence = 0): string {
  if (!Number.isSafeInteger(occurrence) || occurrence < 0 || occurrence >= Number.MAX_SAFE_INTEGER)
    throw new RangeError('occurrence and its one-based suffix must be safe non-negative integers');

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

  if (value.length === 0) errors.push(`${path} must not be empty`);
  const valid = value.every((item) => Number.isSafeInteger(item) && item > 0);
  if (!valid) errors.push(`${path} must contain positive integers`);
  if (new Set(value).size !== value.length) errors.push(`${path} must contain unique values`);
  return value.length > 0 && valid;
}

function validateStringArray(
  value: unknown,
  path: string,
  errors: string[],
  allowEmpty = false
): boolean {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return false;
  }

  if (!allowEmpty && value.length === 0) errors.push(`${path} must not be empty`);
  const valid = value.every((item) => typeof item === 'string' && item.length > 0);
  if (!valid) errors.push(`${path} must contain non-empty strings`);
  if (new Set(value).size !== value.length) errors.push(`${path} must contain unique values`);
  return (allowEmpty || value.length > 0) && valid;
}

function validateReference(value: unknown, path: string, errors: string[]): boolean {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return false;
  }

  let hasReference = false;
  if (value.eventIds !== undefined) {
    hasReference =
      validatePositiveIntegerArray(value.eventIds, `${path}.eventIds`, errors) || hasReference;
  }
  if (value.elementIds !== undefined) {
    hasReference =
      validateStringArray(value.elementIds, `${path}.elementIds`, errors) || hasReference;
  }
  if (!hasReference) errors.push(`${path} must contain at least one eventId or elementId`);
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

function validateValueChange(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  const sides = ['before', 'after'].filter((side) => value[side] !== undefined);
  if (sides.length === 0) errors.push(`${path} must contain before or after`);
  sides.forEach((side) => {
    if (!isComparisonValue(value[side])) errors.push(`${path}.${side} must be JSON-compatible`);
  });
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
    if (
      (value.kind.endsWith('-changed') || value.kind.endsWith('-reordered')) &&
      (value.base === undefined || value.head === undefined)
    )
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
  if (value.details !== undefined) {
    if (!isRecord(value.details)) errors.push(`${path}.details must be an object`);
    else
      Object.entries(value.details).forEach(([name, detail]) =>
        validateValueChange(detail, `${path}.details.${name}`, errors)
      );
  }
}

function validateView(value: unknown, viewId: string, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  if (!Number.isInteger(value.schemaVersion) || Number(value.schemaVersion) < 1)
    errors.push(`${path}.schemaVersion must be a positive integer`);

  for (const field of ['base', 'head', 'diff', 'alignment']) {
    if (!isRecord(value[field])) errors.push(`${path}.${field} must be an object`);
  }

  if (viewId === 'sequence') validateSequenceView(value, path, errors);
}

function validatePositiveInteger(value: unknown, path: string, errors: string[]): void {
  if (!Number.isInteger(value) || Number(value) < 1)
    errors.push(`${path} must be a positive integer`);
}

/** Structural and mandatory semantic checks for the envelope and sequence v1.
 * Reserved non-sequence views receive envelope checks only, not interoperability proof.
 */
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
      else availableViews.add(viewId);
      validateView(view, viewId, `$.views.${viewId}`, errors);
    });
  }

  const capabilityViews = new Set<string>();
  if (!isRecord(value.capabilities)) errors.push('$.capabilities must be an object');
  else {
    if (!isRecord(value.capabilities.views) || Object.keys(value.capabilities.views).length === 0) {
      errors.push('$.capabilities.views must contain at least one view capability');
    } else {
      Object.entries(value.capabilities.views).forEach(([viewId, version]) => {
        if (!viewIds.has(viewId)) errors.push(`$.capabilities.views.${viewId} is unsupported`);
        else capabilityViews.add(viewId);
        validatePositiveInteger(version, `$.capabilities.views.${viewId}`, errors);
        if (viewId === 'sequence' && version !== 1)
          errors.push('$.capabilities.views.sequence must be supported version 1');
        const view = isRecord(value.views) ? value.views[viewId] : undefined;
        if (!isRecord(view))
          errors.push(`$.capabilities.views.${viewId} has no corresponding view`);
        else if (view.schemaVersion !== version)
          errors.push(`$.capabilities.views.${viewId} must match the view schemaVersion`);
      });
    }

    if (value.capabilities.navigation !== undefined) {
      if (!isRecord(value.capabilities.navigation))
        errors.push('$.capabilities.navigation must be an object');
      else {
        if (value.capabilities.navigation.changes !== undefined)
          validatePositiveInteger(
            value.capabilities.navigation.changes,
            '$.capabilities.navigation.changes',
            errors
          );
        if (value.capabilities.navigation.eventAlignment !== undefined)
          validatePositiveInteger(
            value.capabilities.navigation.eventAlignment,
            '$.capabilities.navigation.eventAlignment',
            errors
          );
      }
    }
  }

  availableViews.forEach((viewId) => {
    if (!capabilityViews.has(viewId))
      errors.push(`$.views.${viewId} has no corresponding capability`);
  });

  if (!Array.isArray(value.changes)) errors.push('$.changes must be an array');
  else {
    const ids = new Set<string>();
    value.changes.forEach((change, index) =>
      validateChange(change, `$.changes[${index}]`, availableViews, ids, errors)
    );
  }

  validateSequenceReferences(value, errors);

  if (value.extensions !== undefined && !isRecord(value.extensions))
    errors.push('$.extensions must be an object');

  return errors;
}

export function assertAppMapComparison(value: unknown): asserts value is AppMapComparison {
  const errors = validateAppMapComparison(value);
  if (errors.length > 0)
    throw new TypeError(`Invalid AppMap comparison bundle:\n- ${errors.join('\n- ')}`);
}
