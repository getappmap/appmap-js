import { readFile } from 'fs/promises';
import path from 'path';

import {
  APPMAP_COMPARISON_CHANGE_ID_PATTERN,
  APPMAP_COMPARISON_KIND,
  APPMAP_COMPARISON_SCHEMA_VERSION,
  appMapComparisonSchema,
  assertAppMapComparison,
  behavioralChangeKinds,
  canonicalComparisonIdentity,
  comparisonViewIds,
  makeComparisonChangeId,
  validateAppMapComparison,
} from '../../src/comparison';

const examples = ['clean', 'added', 'removed', 'changed', 'reordered'];
const examplesDir = path.resolve(__dirname, '../../schema/examples');

async function loadExample(name: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path.join(examplesDir, `${name}.json`), 'utf8'));
}

describe('AppMap comparison contract', () => {
  it.each(examples)('accepts the %s conformance fixture', async (name) => {
    const example = await loadExample(name);
    expect(validateAppMapComparison(example)).toEqual([]);
    expect(() => assertAppMapComparison(example)).not.toThrow();
  });

  it('keeps the published JSON schema aligned with runtime constants', () => {
    expect(appMapComparisonSchema.$id).toBe('https://appmap.io/schemas/comparison/v1');
    expect(appMapComparisonSchema.properties.kind.const).toBe(APPMAP_COMPARISON_KIND);
    expect(appMapComparisonSchema.properties.schemaVersion.const).toBe(
      APPMAP_COMPARISON_SCHEMA_VERSION
    );
    expect(appMapComparisonSchema.$defs.change.properties.id.pattern).toBe(
      APPMAP_COMPARISON_CHANGE_ID_PATTERN
    );
    expect(appMapComparisonSchema.$defs.change.properties.kind.enum).toEqual(
      behavioralChangeKinds
    );
    expect(Object.keys(appMapComparisonSchema.properties.views.properties)).toEqual(
      comparisonViewIds
    );
    expect(
      Object.keys(appMapComparisonSchema.$defs.capabilities.properties.views.properties)
    ).toEqual(comparisonViewIds);
  });

  it('canonicalizes identities independently of object key order', () => {
    expect(canonicalComparisonIdentity({ head: 2, base: 1 })).toBe(
      canonicalComparisonIdentity({ base: 1, head: 2 })
    );
    expect(makeComparisonChangeId({ head: 2, base: 1 })).toBe(
      makeComparisonChangeId({ base: 1, head: 2 })
    );
  });

  it('uses an occurrence suffix only for indistinguishable repeated changes', () => {
    const identity = { kind: 'call-added', action: 'authorize' };
    expect(makeComparisonChangeId(identity)).toMatch(new RegExp(APPMAP_COMPARISON_CHANGE_ID_PATTERN));
    expect(makeComparisonChangeId(identity, 1)).toBe(`${makeComparisonChangeId(identity)}_2`);
  });

  it('rejects duplicate change ids and mismatched view capabilities', async () => {
    const example = await loadExample('added');
    const duplicate = JSON.parse(JSON.stringify(example));
    duplicate.changes.push(duplicate.changes[0]);
    duplicate.capabilities.views.sequence = 2;

    const errors = validateAppMapComparison(duplicate);
    expect(errors).toContain('$.changes[1].id must be unique');
    expect(errors).toContain('$.capabilities.views.sequence must match the view schemaVersion');
  });

  it('rejects empty references and details without a before or after value', async () => {
    const example = JSON.parse(JSON.stringify(await loadExample('added')));
    example.changes[0].head.eventIds = [];
    example.changes[0].details = { name: {} };

    const errors = validateAppMapComparison(example);
    expect(errors).toContain('$.changes[0].head.eventIds must not be empty');
    expect(errors).toContain('$.changes[0].details.name must contain before or after');
  });

  it('requires every supplied view to declare a matching capability', async () => {
    const example = JSON.parse(JSON.stringify(await loadExample('clean')));
    example.views.trace = {
      schemaVersion: 1,
      base: {},
      head: {},
      diff: {},
      alignment: {},
    };

    expect(validateAppMapComparison(example)).toContain(
      '$.views.trace has no corresponding capability'
    );
  });

  it('requires the correct side for added, removed, changed, and reordered changes', async () => {
    const added = JSON.parse(JSON.stringify(await loadExample('added')));
    delete added.changes[0].head;

    const changed = JSON.parse(JSON.stringify(await loadExample('changed')));
    delete changed.changes[0].base;

    expect(validateAppMapComparison(added)).toContain(
      '$.changes[0].head is required for an added change'
    );
    expect(validateAppMapComparison(changed)).toContain(
      '$.changes[0].base and $.changes[0].head are required for changed/reordered changes'
    );
  });
});
