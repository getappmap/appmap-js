import { readFile } from 'fs/promises';
import path from 'path';

import {
  APPMAP_COMPARISON_KIND,
  APPMAP_COMPARISON_SCHEMA_VERSION,
  appMapComparisonSchema,
  assertAppMapComparison,
  canonicalComparisonIdentity,
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

  it('exports a schema which matches the runtime constants', () => {
    expect(appMapComparisonSchema.$id).toBe('https://appmap.io/schemas/comparison/v1');
    expect(appMapComparisonSchema.properties.kind.const).toBe(APPMAP_COMPARISON_KIND);
    expect(appMapComparisonSchema.properties.schemaVersion.const).toBe(
      APPMAP_COMPARISON_SCHEMA_VERSION
    );
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
    expect(makeComparisonChangeId(identity)).toMatch(/^chg_[0-9a-f]{20}$/);
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
});
