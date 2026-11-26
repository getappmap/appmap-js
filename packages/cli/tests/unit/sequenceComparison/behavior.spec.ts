import { assertAppMapComparison, BehavioralChange, ComparisonSequenceView } from '@appland/models';
import { buildComparisonBundle as sourceBuild } from '../../../src/cmds/sequenceDiagramCompare';
import { join } from 'path';
import { Call, flatten, ownedFixture, recording } from './support';

let fixture: Awaited<ReturnType<typeof ownedFixture>>;
beforeEach(async () => {
  fixture = await ownedFixture();
});
afterEach(async () => {
  await fixture.clean();
});
function targets(view: ComparisonSequenceView, changes: BehavioralChange[]) {
  for (const side of ['base', 'head', 'diff'] as const) {
    const actions = flatten(view[side]);
    expect(actions.every((a) => typeof a.elementId === 'string')).toBe(true);
    expect(new Set(actions.map((a) => a.elementId)).size).toBe(actions.length);
    for (const change of changes) {
      const ref = change.views.sequence?.[side];
      if (!ref) continue;
      expect(ref.elementIds?.length).toBe(1);
      const resolved = actions.filter((a) => ref.elementIds?.includes(a.elementId || ''));
      expect(resolved).toHaveLength(1);
      expect(resolved[0].eventIds).toEqual(expect.arrayContaining(ref.eventIds || []));
      if (side === 'diff') expect(resolved[0].eventIds).toEqual(ref.eventIds || []);
    }
  }
}
const compiledBuild: typeof sourceBuild = (...args) => {
  const command = require(
    join(__dirname, '../../../built/cmds/sequenceDiagramCompare')
  ) as typeof import('../../../src/cmds/sequenceDiagramCompare');
  return command.buildComparisonBundle(...args);
};
describe.each([
  ['source', sourceBuild],
  ['compiled', compiledBuild],
] as const)(
  'Given independent sanitized recordings via %s public API',
  (_entry, buildComparisonBundle) => {
    async function compare(base: Call[], head: Call[], loops = false, start = 1) {
      await fixture.put(recording(base, start), recording(head, start));
      return buildComparisonBundle(fixture.base, fixture.head, { loops, scenario: 'test' });
    }

    it.each([
      ['unchanged', [{ name: 'one' }], [{ name: 'one' }], []],
      ['empty', [], [], []],
      ['added', [], [{ name: 'one' }], ['call-added']],
      ['removed', [{ name: 'one' }], [], ['call-removed']],
      [
        'return changed',
        [{ name: 'one', result: 'String' }],
        [{ name: 'one', result: 'Integer' }],
        ['call-changed'],
      ],
      [
        'query changed',
        [{ name: 'sql', query: 'SELECT * FROM users' }],
        [{ name: 'sql', query: 'SELECT * FROM orders' }],
        ['query-changed'],
      ],
      [
        'different actors',
        [{ name: 'same', actor: 'A' }],
        [{ name: 'same', actor: 'B' }],
        ['call-added', 'call-removed'],
      ],
      [
        'sibling reorder',
        [{ name: 'a' }, { name: 'b' }],
        [{ name: 'b' }, { name: 'a' }],
        ['call-reordered'],
      ],
    ] as [string, Call[], Call[], string[]][])(
      'When %s is compared Then exact kinds and side targets agree',
      async (_name, base, head, kinds) => {
        const bundle = await compare(base, head);
        expect(bundle.changes.map((c) => c.kind).sort()).toEqual(kinds.sort());
        for (const change of bundle.changes) {
          expect(Boolean(change.base)).toBe(!change.kind.endsWith('-added'));
          expect(Boolean(change.head)).toBe(!change.kind.endsWith('-removed'));
        }
        targets(bundle.views.sequence, bundle.changes);
        expect(() => assertAppMapComparison(JSON.parse(JSON.stringify(bundle)))).not.toThrow();
      }
    );
    it('When a subtree is reparented Then it is changed with explicit locations, not reordered', async () => {
      const bundle = await compare(
        [{ name: 'p', children: [{ name: 'child' }] }, { name: 'q' }],
        [{ name: 'p' }, { name: 'q', children: [{ name: 'child' }] }]
      );
      expect(bundle.changes.map((c) => c.kind)).toEqual(['call-changed']);
      expect(bundle.changes[0].details?.location).toEqual({
        before: {
          parentElementId: 'base:1',
          ancestors: [{ nodeType: 3, name: 'p', actors: [null, 'package:Service'] }],
          index: 0,
        },
        after: {
          parentElementId: 'head:2',
          ancestors: [{ nodeType: 3, name: 'q', actors: [null, 'package:Service'] }],
          index: 0,
        },
      });
      targets(bundle.views.sequence, bundle.changes);
    });
    it('When repetition increases Then one authentic call is added, not a structural control-flow change', async () => {
      // Supersedes the old control-flow-changed oracle, which blessed a display
      // loop count as behavior. Keep the grouped views, but align raw events.
      const repeated = (count: number): Call[] => [
        { name: 'parent', children: Array.from({ length: count }, () => ({ name: 'child' })) },
      ];
      const bundle = await compare(repeated(2), repeated(3), true);
      expect(bundle.changes.map((c) => c.kind)).toEqual(['call-added']);
      expect(flatten(bundle.views.sequence.base).find((a) => a.nodeType === 1)).toMatchObject({
        nodeType: 1,
        count: 2,
      });
      expect(flatten(bundle.views.sequence.head).find((a) => a.nodeType === 1)).toMatchObject({
        nodeType: 1,
        count: 3,
      });
      expect(flatten(bundle.views.sequence.diff).map((a) => a.nodeType)).toEqual([3, 3, 3, 3]);
      const ref = bundle.changes[0].views.sequence?.head;
      expect(ref?.eventIds).toEqual([6]);
      expect(bundle.changes[0].base).toBeUndefined();
      const action = flatten(bundle.views.sequence.head).find(
        (a) => a.elementId === ref?.elementIds?.[0]
      );
      expect(action?.nodeType).toBe(3);
      expect(action?.eventIds).toEqual([2, 4, 6]);
      targets(bundle.views.sequence, bundle.changes);
    });
    it('When return type changes outside the sequence digest Then overlay marks the target changed', async () => {
      const bundle = await compare(
        [{ name: 'one', result: 'String' }],
        [{ name: 'one', result: 'Integer' }]
      );
      expect(bundle.changes[0].details?.result).toEqual({ before: 'string', after: 'integer' });
      expect(flatten(bundle.views.sequence.diff)[0].diffMode).toBe(3);
    });
    it('When return properties change Then details and identity retain the actual distinction', async () => {
      const call = (name: string): Call[] => [
        { name: 'one', result: 'Widget', properties: [{ name, class: 'String' }] },
      ];
      const first = await compare(call('a'), call('b'));
      const second = await compare(call('a'), call('c'));
      expect(first.changes.map((c) => c.kind)).toEqual(['call-changed']);
      expect(first.changes[0].details?.returnValue).toEqual({
        before: {
          raisesException: false,
          returnValueType: { name: 'Widget', properties: ['a:String'] },
        },
        after: {
          raisesException: false,
          returnValueType: { name: 'Widget', properties: ['b:String'] },
        },
      });
      expect(first.changes[0].id).not.toBe(second.changes[0].id);
    });
    it('When recordings reuse event IDs Then removed and added diff targets remain distinct', async () => {
      const bundle = await compare([{ name: 'same', actor: 'A' }], [{ name: 'same', actor: 'B' }]);
      const diff = flatten(bundle.views.sequence.diff);
      expect(diff.map((a) => a.eventIds)).toEqual([[1], [1]]);
      expect(new Set(bundle.changes.map((c) => c.views.sequence?.diff?.elementIds?.[0])).size).toBe(
        2
      );
      for (const change of bundle.changes) {
        const target = diff.find(
          (a) => a.elementId === change.views.sequence?.diff?.elementIds?.[0]
        );
        expect(target && 'callee' in target && target.callee).toBe(
          change.kind === 'call-added' ? 'package:B' : 'package:A'
        );
      }
      targets(bundle.views.sequence, bundle.changes);
    });
    it('When unrelated earlier changes or event numbers differ Then the existing change ID stays stable', async () => {
      const first = await compare([], [{ name: 'unique', actor: 'Unique' }]);
      const second = await compare(
        [],
        [
          { name: 'earlier', actor: 'Other' },
          { name: 'unique', actor: 'Unique' },
        ],
        false,
        100
      );
      expect(second.changes.find((c) => c.summary.includes('unique'))?.id).toBe(
        first.changes[0].id
      );
    });
    it('When indistinguishable occurrences repeat Then IDs follow the documented occurrence rule', async () => {
      const bundle = await compare([], [{ name: 'same' }, { name: 'same' }, { name: 'same' }]);
      expect(bundle.changes.map((c) => c.id)).toEqual([
        bundle.changes[0].id,
        `${bundle.changes[0].id}_2`,
        `${bundle.changes[0].id}_3`,
      ]);
      targets(bundle.views.sequence, bundle.changes);
    });
    it.each([
      null,
      {},
      { events: null, classMap: [] },
      { events: [{ id: 1, event: 'wat' }], classMap: [] },
      { events: [{ id: 1, event: 'return', parent_id: 99, thread_id: 1 }], classMap: [] },
    ])('When malformed AppMap %j is supplied Then production fails explicitly', async (bad) => {
      await fixture.put(bad, recording([]));
      await expect(buildComparisonBundle(fixture.base, fixture.head)).rejects.toThrow(/AppMap/i);
    });
  }
);
