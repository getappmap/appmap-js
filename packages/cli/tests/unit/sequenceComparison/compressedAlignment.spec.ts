import type { ComparisonSequenceAction, ComparisonSequenceDiagram } from '@appland/models';
import { assertAppMapComparison } from '@appland/models';
import { join } from 'path';
import { buildComparisonBundle as sourceBuild } from '../../../src/cmds/sequenceDiagramCompare';
import { Call, flatten, ownedFixture, recording } from './support';

const compiledBuild: typeof sourceBuild = (...args) => {
  const command = require(
    join(__dirname, '../../../built/cmds/sequenceDiagramCompare')
  ) as typeof import('../../../src/cmds/sequenceDiagramCompare');
  return command.buildComparisonBundle(...args);
};
let fixture: Awaited<ReturnType<typeof ownedFixture>>;
beforeEach(async () => {
  fixture = await ownedFixture();
});
afterEach(async () => {
  await fixture.clean();
});
const sorted = (items: unknown[]): unknown[] =>
  [...items].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
function shape(action: ComparisonSequenceAction) {
  return {
    nodeType: action.nodeType,
    eventIds: action.eventIds,
    diffMode: action.diffMode ?? null,
    ...(action.nodeType === 1 ? { count: action.count } : {}),
    ...(action.nodeType === 3
      ? { name: action.name, result: action.returnValue?.returnValueType?.name }
      : {}),
    ...(action.nodeType === 6 ? { query: action.query } : {}),
  };
}
function queryEvents(diagram: ComparisonSequenceDiagram) {
  return flatten(diagram)
    .flatMap((action) =>
      action.nodeType === 6 ? action.eventIds.map((id) => ({ id, query: action.query })) : []
    )
    .sort((a, b) => a.id - b.id);
}
function verifyTargets(bundle: Awaited<ReturnType<typeof sourceBuild>>): void {
  assertAppMapComparison(bundle);
  for (const side of ['base', 'head', 'diff'] as const) {
    const actions = flatten(bundle.views.sequence[side]);
    expect(actions.every((action) => typeof action.elementId === 'string')).toBe(true);
    expect(new Set(actions.map((action) => action.elementId)).size).toBe(actions.length);
    for (const change of bundle.changes) {
      const ref = change.views.sequence?.[side];
      if (!ref) continue;
      expect(ref.elementIds).toHaveLength(1);
      const target = actions.filter((action) => ref.elementIds?.includes(action.elementId || ''));
      expect(target).toHaveLength(1);
      expect(target[0].eventIds).toEqual(expect.arrayContaining(ref.eventIds || []));
      if (side === 'diff') expect(target[0].eventIds).toEqual(ref.eventIds || []);
    }
  }
}
describe.each([
  ['source', sourceBuild],
  ['compiled', compiledBuild],
] as const)(
  'Given default-compressed recordings via %s public producer',
  (_entry, buildComparisonBundle) => {
    async function compare(base: Call[], head: Call[]) {
      await fixture.put(
        recording([{ name: 'parent', children: base }]),
        recording([{ name: 'parent', children: head }])
      );
      return buildComparisonBundle(fixture.base, fixture.head); // Default loops=true, no workaround.
    }
    it.each([false, true])(
      'When heterogeneous and homogeneous returns swap (reverse=%s) Then complete overlay shapes and event targets survive alignment',
      async (reverse) => {
        const mixed: Call[] = ['String', 'Integer', 'String'].map((result) => ({
          name: 'a',
          result,
        }));
        const uniform: Call[] = ['String', 'String', 'String'].map((result) => ({
          name: 'a',
          result,
        }));
        const bundle = await compare(reverse ? uniform : mixed, reverse ? mixed : uniform);
        verifyTargets(bundle);
        const sequence = bundle.views.sequence;
        const mixedSide = reverse ? sequence.head : sequence.base;
        const uniformSide = reverse ? sequence.base : sequence.head;
        expect(flatten(mixedSide).map((action) => action.nodeType)).toEqual([3, 3, 3, 3]);
        expect(flatten(uniformSide).map((action) => action.nodeType)).toEqual([3, 1, 3]);
        // The former oracle expected five layout edits here. Actual behavior
        // is one return change; grouping must not manufacture canonical edits.
        const expected = [
          { nodeType: 3, eventIds: [1], diffMode: null, name: 'parent', result: 'void' },
          ...[2, 4, 6].map((id, index) => ({
            nodeType: 3,
            eventIds: [id],
            diffMode: index === 1 ? 3 : null,
            name: 'a',
            result: reverse && index === 1 ? 'integer' : 'string',
          })),
        ];
        expect(sorted(flatten(sequence.diff).map(shape))).toEqual(sorted(expected));
        expect(
          flatten(sequence.diff)
            .flatMap((action) => action.eventIds)
            .sort((a, b) => a - b)
        ).toEqual([1, 2, 4, 6]);
        expect(sequence.diff.rootActions).toHaveLength(1);
        expect(flatten(sequence.diff).some((action) => action.nodeType === 1)).toBe(false);
        expect(bundle.changes.map((change) => change.kind)).toEqual(['call-changed']);
        expect(bundle.changes[0].details?.result).toEqual(
          reverse ? { before: 'string', after: 'integer' } : { before: 'integer', after: 'string' }
        );
      }
    );
    it('When a repeated truncated SELECT becomes a DELETE Then each query event and its exact change survive compression', async () => {
      const q1 = 'SELECT * FROM users WHERE ...';
      const q2 = 'DELETE FROM orders WHERE ...';
      const query = (sql: string): Call => ({ name: 'sql', query: sql });
      const bundle = await compare([query(q1), query(q1)], [query(q1), query(q2)]);
      verifyTargets(bundle);
      const sequence = bundle.views.sequence;
      expect(queryEvents(sequence.base)).toEqual([
        { id: 2, query: q1 },
        { id: 4, query: q1 },
      ]);
      expect(queryEvents(sequence.head)).toEqual([
        { id: 2, query: q1 },
        { id: 4, query: q2 },
      ]);
      expect(flatten(sequence.base).find((action) => action.nodeType === 1)).toMatchObject({
        nodeType: 1,
        count: 2,
      });
      // The old four-edit compressed-layout oracle is explicitly replaced by
      // one changed raw query, while retaining both real compressed base events.
      const expected = [
        { nodeType: 3, eventIds: [1], diffMode: null, name: 'parent', result: 'void' },
        { nodeType: 6, eventIds: [2], diffMode: null, query: q1 },
        { nodeType: 6, eventIds: [4], diffMode: 3, query: q2 },
      ];
      expect(sorted(flatten(sequence.diff).map(shape))).toEqual(sorted(expected));
      expect(bundle.changes.map((change) => change.kind)).toEqual(['query-changed']);
      expect(bundle.changes[0].details?.name).toEqual({ before: q1, after: q2 });
      expect(bundle.changes[0].base?.eventIds).toEqual([4]);
      expect(bundle.changes[0].head?.eventIds).toEqual([4]);
    });
  }
);
