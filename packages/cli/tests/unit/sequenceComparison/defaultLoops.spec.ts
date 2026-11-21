import type {
  BehavioralChange,
  ComparisonSequenceDiagram,
  ComparisonSequenceView,
} from '@appland/models';
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
const calls = (...names: string[]): Call[] => names.map((name) => ({ name }));
function addedCall(
  view: ComparisonSequenceView,
  changes: BehavioralChange[],
  name: string
): BehavioralChange {
  const matches = changes.filter((change) => {
    const target = flatten(view.head).find(
      (action) => action.elementId === change.head?.elementIds?.[0]
    );
    return target?.nodeType === 3 && target.name === name;
  });
  expect(matches).toHaveLength(1);
  expect(matches[0].kind).toBe('call-added');
  expect(matches[0].head?.eventIds).toHaveLength(1);
  return matches[0];
}
function eventCalls(diagram: ComparisonSequenceDiagram) {
  return flatten(diagram)
    .flatMap((action) =>
      action.nodeType === 3
        ? action.eventIds.map((id) => ({
            id,
            name: action.name,
            result: action.returnValue?.returnValueType?.name,
          }))
        : []
    )
    .sort((a, b) => a.id - b.id);
}
describe.each([
  ['source', sourceBuild],
  ['compiled', compiledBuild],
] as const)(
  'Given default loop compression via %s public producer',
  (_entry, buildComparisonBundle) => {
    async function compare(base: Call[], head: Call[], loops?: boolean, start = 1) {
      await fixture.put(
        recording([{ name: 'parent', children: base }], start),
        recording([{ name: 'parent', children: head }], start)
      );
      // Deliberately omit loops unless requesting the uncompressed oracle.
      return buildComparisonBundle(
        fixture.base,
        fixture.head,
        loops === undefined ? {} : { loops }
      );
    }
    it('When an unrelated b repetition precedes added a Then the added-call ID stays stable', async () => {
      const original = await compare(calls('a', 'a'), calls('a', 'a', 'a'));
      const extended = await compare(
        calls('b', 'b', 'a', 'a'),
        calls('b', 'b', 'b', 'a', 'a', 'a')
      );
      const a = addedCall(original.views.sequence, original.changes, 'a');
      const extendedA = addedCall(extended.views.sequence, extended.changes, 'a');
      const b = addedCall(extended.views.sequence, extended.changes, 'b');
      expect(extendedA.id).toBe(a.id);
      expect(b.id).not.toBe(a.id);
      const renumbered = await compare(calls('a', 'a'), calls('a', 'a', 'a'), undefined, 100);
      expect(addedCall(renumbered.views.sequence, renumbered.changes, 'a').id).toBe(a.id);
    });
    it('When indistinguishable raw additions in repeated groups recur Then occurrence suffixes disambiguate them', async () => {
      const bundle = await compare(
        calls('a', 'a', 'divider', 'a', 'a'),
        calls('a', 'a', 'a', 'divider', 'a', 'a', 'a')
      );
      expect(bundle.changes.map((change) => change.kind)).toEqual(['call-added', 'call-added']);
      expect(bundle.changes[1].id).toBe(`${bundle.changes[0].id}_2`);
    });
    it('P1: When the second repeated call returns Integer instead of String Then default compression preserves the changed return', async () => {
      const base: Call[] = [
        { name: 'a', result: 'String' },
        { name: 'a', result: 'String' },
      ];
      const head: Call[] = [
        { name: 'a', result: 'String' },
        { name: 'a', result: 'Integer' },
      ];
      const oracle = await compare(base, head, false);
      expect(oracle.changes.map((change) => change.kind)).toEqual(['call-changed']);
      expect(oracle.changes[0].details?.result).toEqual({ before: 'string', after: 'integer' });
      const bundle = await compare(base, head);
      expect(eventCalls(bundle.views.sequence.base)).toEqual(
        eventCalls(oracle.views.sequence.base)
      );
      expect(eventCalls(bundle.views.sequence.head)).toEqual(
        eventCalls(oracle.views.sequence.head)
      );
      expect(bundle.changes.map(({ id, kind, details }) => ({ id, kind, details }))).toEqual(
        oracle.changes.map(({ id, kind, details }) => ({ id, kind, details }))
      );
    });
    it('P1: When the tail after a repeated two-call window changes c to d Then default compression retains the tail and its change', async () => {
      const base = calls('a', 'b', 'a', 'b', 'c');
      const head = calls('a', 'b', 'a', 'b', 'd');
      const oracle = await compare(base, head, false);
      expect(oracle.changes.map((change) => change.kind)).toEqual(['call-changed']);
      const bundle = await compare(base, head);
      expect(eventCalls(bundle.views.sequence.base)).toEqual(
        eventCalls(oracle.views.sequence.base)
      );
      expect(eventCalls(bundle.views.sequence.head)).toEqual(
        eventCalls(oracle.views.sequence.head)
      );
      expect(bundle.changes.map((change) => change.kind)).toEqual(['call-changed']);
      expect(bundle.changes[0].details?.name).toEqual({ before: 'c', after: 'd' });
    });
  }
);
