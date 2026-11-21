/* Malformed-input fixtures intentionally mutate untrusted JSON shapes. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { readFileSync } from 'fs';
import path from 'path';
import {
  canonicalComparisonIdentity,
  makeComparisonChangeId,
  validateAppMapComparison,
} from '../../src/comparison';

const actor = { id: 'service', name: 'Service', order: 0 };
function action(nodeType = 3, elementId = 'target'): any {
  const common = {
    nodeType,
    digest: 'digest',
    subtreeDigest: 'tree',
    children: [],
    eventIds: [1],
    elementId,
  };
  switch (nodeType) {
    case 1:
      return { ...common, eventIds: [], count: 2 };
    case 3:
      return { ...common, callee: actor.id, name: 'run', stableProperties: {} };
    case 4:
    case 5:
      return { ...common, callee: actor.id, route: 'GET /', status: 200 };
    case 6:
      return { ...common, callee: actor.id, query: 'SELECT 1' };
    default:
      return common;
  }
}
function bundle(): any {
  const diagram = () => ({ actors: [{ ...actor }], rootActions: [action()] });
  return {
    kind: 'appmap.comparison',
    schemaVersion: 1,
    producer: { name: 'test', version: '1' },
    scenario: { id: 'test' },
    recordings: { base: 'base', head: 'head' },
    capabilities: { views: { sequence: 1 } },
    changes: [
      {
        id: makeComparisonChangeId('test'),
        kind: 'call-changed',
        summary: 'Changed',
        base: { elementIds: ['target'] },
        head: { elementIds: ['target'] },
        views: {
          sequence: {
            base: { elementIds: ['target'] },
            head: { elementIds: ['target'] },
            diff: { elementIds: ['target'] },
          },
        },
      },
    ],
    views: {
      sequence: {
        schemaVersion: 1,
        base: diagram(),
        head: diagram(),
        diff: diagram(),
        alignment: { actorOrder: [actor.id] },
      },
    },
  };
}

describe('Given the portable sequence comparison contract', () => {
  it.each([
    NaN,
    Infinity,
    -Infinity,
    new Date(0),
    { x: undefined },
    [undefined],
    new Map(),
    /regex/,
    Object.assign([], { extra: 1 }),
  ])('When canonicalizing unsupported identity %p Then reject rather than collide', (value) => {
    expect(() => canonicalComparisonIdentity(value)).toThrow();
  });
  it('When canonicalizing cyclic, sparse, symbolic or accessor identities Then reject explicitly', () => {
    const cyclic: any = {};
    cyclic.self = cyclic;
    const getter = Object.defineProperty({}, 'value', { enumerable: true, get: () => 1 });
    for (const value of [cyclic, Array(1), { [Symbol('x')]: 1 }, getter])
      expect(() => canonicalComparisonIdentity(value)).toThrow(TypeError);
  });
  it('When identity depth or node limits are exceeded Then reject with a bounded error', () => {
    let deep: any = null;
    for (let i = 0; i < 66; i++) deep = [deep];
    expect(() => canonicalComparisonIdentity(deep)).toThrow(/depth/i);
    expect(() => canonicalComparisonIdentity(Array(10001).fill(null))).toThrow(/node/i);
  });
  it.each([Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1, Infinity, -1, 0.5])(
    'When occurrence %p cannot have a safe suffix Then reject',
    (occurrence) => {
      expect(() => makeComparisonChangeId('identity', occurrence)).toThrow(RangeError);
    }
  );
  it('When keys reorder or unrelated identities precede a change Then its ID stays stable', () => {
    const id = makeComparisonChangeId({ a: 1, b: [2, null] });
    makeComparisonChangeId({ unrelated: true });
    expect(makeComparisonChangeId({ b: [2, null], a: 1 })).toBe(id);
    expect(makeComparisonChangeId('repeat', 1)).toBe(`${makeComparisonChangeId('repeat')}_2`);
    expect(canonicalComparisonIdentity({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });
  it('When both sequence versions are unsupported Then reject despite matching versions', () => {
    const value = bundle();
    value.capabilities.views.sequence = 2;
    value.views.sequence.schemaVersion = 2;
    expect(validateAppMapComparison(value).join(' ')).toMatch(/sequence.*(?:version|Version)/);
  });
  it.each([1, 3, 4, 5, 6])(
    'When serialized action nodeType %p has a real target Then accept',
    (nodeType) => {
      const value = bundle();
      value.views.sequence.diff.rootActions = [action(nodeType)];
      expect(validateAppMapComparison(value)).toEqual([]);
    }
  );
  it.each([
    (d: any) => {
      d.actors = [null];
    },
    (d: any) => {
      d.rootActions = [null];
    },
    (d: any) => {
      d.rootActions[0].nodeType = 2;
    },
    (d: any) => {
      delete d.rootActions[0].children;
    },
    (d: any) => {
      d.rootActions[0].callee = {};
    },
    (d: any) => {
      d.rootActions[0].callee = 'missing-actor';
    },
    (d: any) => {
      d.rootActions[0].eventIds = [0];
    },
    (d: any) => {
      d.rootActions[0].returnValue = { raisesException: 'false' };
    },
    (d: any) => {
      d.rootActions[0].stableProperties = { broken: [] };
    },
    (d: any) => {
      d.rootActions[0].elementId = '';
    },
    (d: any) => {
      d.rootActions[0].labels = [1];
    },
    (d: any) => {
      d.rootActions[0].diffMode = 5;
    },
  ])('When a sequence graph is malformed Then reject (%#)', (mutate) => {
    const value = bundle();
    mutate(value.views.sequence.diff);
    expect(validateAppMapComparison(value).length).toBeGreaterThan(0);
  });
  it('When an action graph cycles Then return a diagnostic rather than overflow', () => {
    const value = bundle();
    const root = value.views.sequence.diff.rootActions[0];
    root.children.push(root);
    expect(validateAppMapComparison(value).join(' ')).toMatch(/cycle|cyclic/i);
  });
  it('When supplied element IDs dangle or collide Then reject on the correct diagram side', () => {
    const missing = bundle();
    missing.changes[0].views.sequence.diff.elementIds = ['missing'];
    expect(validateAppMapComparison(missing).join(' ')).toMatch(/elementIds/);
    const duplicate = bundle();
    duplicate.views.sequence.diff.rootActions.push(action());
    expect(validateAppMapComparison(duplicate).join(' ')).toMatch(/(?:unique|duplicate)/i);
    const topLevel = bundle();
    topLevel.changes[0].base.elementIds = ['missing'];
    expect(validateAppMapComparison(topLevel).join(' ')).toMatch(/elementIds/);
  });
  it('When event IDs overlap but element IDs differ Then accept unambiguous element targets', () => {
    const value = bundle();
    value.views.sequence.diff.rootActions.push(action(1, 'other'));
    value.views.sequence.diff.rootActions[1].eventIds = [1];
    value.changes[0].views.sequence.diff.eventIds = [1];
    expect(validateAppMapComparison(value)).toEqual([]);
  });
  it('When event-only navigation matches multiple actions Then do not claim a unique target', () => {
    const value = bundle();
    value.views.sequence.diff.rootActions.push(action(3, 'other'));
    value.changes[0].views.sequence.diff = { eventIds: [1] };
    expect(validateAppMapComparison(value).join(' ')).toMatch(/eventIds/);
  });
  it('When recording and navigation metadata are additive Then preserve them', () => {
    const value = bundle();
    value.recordings.metadata = { source: 'fixture' };
    value.capabilities.navigation = { changes: 1, eventAlignment: 1, future: 2 };
    value.views.sequence.diff.rootActions[0].movedFrom = { name: 'old', actorId: actor.id };
    const before = JSON.stringify(value);
    expect(validateAppMapComparison(value)).toEqual([]);
    expect(JSON.stringify(value)).toBe(before);
  });
  it('When published structural fixtures supply references Then their diagrams contain targets', () => {
    const dir = path.resolve(__dirname, '../../schema/examples');
    for (const name of ['added', 'removed', 'changed', 'reordered']) {
      const value = JSON.parse(readFileSync(path.join(dir, `${name}.json`), 'utf8'));
      expect(value.views.sequence.diff.rootActions.length).toBeGreaterThan(0);
      expect(validateAppMapComparison(value)).toEqual([]);
    }
  });
  it.each([
    'show_user',
    'listVsListWithPrefetch',
    'userFoundVsNotFound',
    'userFoundVsNotFound.diff',
  ])(
    'When existing serialized diagram %s is checked Then its legitimate fields survive',
    (name) => {
      const filename = path.resolve(
        __dirname,
        '../../../sequence-diagram/tests/fixtures/sequenceDiagrams',
        `${name}.sequence.json`
      );
      const diagram = JSON.parse(readFileSync(filename, 'utf8'));
      const value = bundle();
      value.changes = [];
      for (const side of ['base', 'head', 'diff']) value.views.sequence[side] = diagram;
      expect(validateAppMapComparison(value)).toEqual([]);
    }
  );
  it('When shared plain JSON and boundary values are canonicalized Then encode without mutation', () => {
    const shared = Object.assign(Object.create(null), { finite: 1 });
    expect(canonicalComparisonIdentity([shared, shared])).toBe('[{"finite":1},{"finite":1}]');
    expect(canonicalComparisonIdentity(Array(9999).fill(null))).toHaveLength(49996);
    expect(makeComparisonChangeId('identity', Number.MAX_SAFE_INTEGER - 1)).toMatch(
      /_9007199254740991$/
    );
  });
  it('When the portable conformance corpus runs Then mandatory runtime outcomes match its manifest', () => {
    const directory = path.resolve(__dirname, '../../schema/conformance');
    const manifest = JSON.parse(readFileSync(path.join(directory, 'manifest.json'), 'utf8')) as {
      file: string;
      structural: boolean;
      semantic: boolean;
    }[];
    for (const entry of manifest) {
      const value = JSON.parse(readFileSync(path.join(directory, entry.file), 'utf8'));
      expect({ file: entry.file, valid: validateAppMapComparison(value).length === 0 }).toEqual({
        file: entry.file,
        valid: entry.semantic,
      });
    }
  });
});
