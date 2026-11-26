import { join } from 'path';
import { buildDiagram, format, FormatType, Specification } from '@appland/sequence-diagram';
import { buildComparisonBundle as sourceBuild } from '../../../src/cmds/sequenceDiagramCompare';
import { loadRecording } from '../../../src/cmds/sequenceComparison/input';
import { flatten, ownedFixture, recording } from './support';

const compiledBuild: typeof sourceBuild = (...args) => {
  const command = require(
    join(__dirname, '../../../built/cmds/sequenceDiagramCompare')
  ) as typeof import('../../../src/cmds/sequenceDiagramCompare');
  return command.buildComparisonBundle(...args);
};
let fixture: Awaited<ReturnType<typeof ownedFixture>>;
beforeEach(async () => {
  fixture = await ownedFixture();
  const repeated = (count: number) =>
    recording([
      {
        name: 'parent',
        children: Array.from({ length: count }, () => ({ name: 'a', result: 'String' })),
      },
    ]);
  await fixture.put(repeated(2), repeated(3));
});
afterEach(async () => {
  await fixture.clean();
});
function withoutTargets(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (key, item: unknown) => (key === 'elementId' ? undefined : item))
  ) as unknown;
}
describe.each([
  ['source', sourceBuild],
  ['compiled', compiledBuild],
] as const)('Given independent semantic and display diagrams via %s', (_entry, build) => {
  it.each([false, true])(
    'When loops=%s and expansion varies Then display digests and properties remain ordinary render output',
    async (loops) => {
      for (const expand of [undefined, 'package:Service', ['package:Service']]) {
        const bundle = await build(fixture.base, fixture.head, { loops, expand });
        for (const side of ['base', 'head'] as const) {
          const file = fixture[side];
          const appmap = await loadRecording(file);
          const diagram = buildDiagram(
            file,
            appmap,
            Specification.build(appmap, {
              loops,
              ...(expand ? { expand: Array.isArray(expand) ? expand : [expand] } : {}),
            })
          );
          // Comparison intentionally aligns actor order across all three views.
          // Normalize only that documented layout choice; compare the entire
          // remaining ordinary payload, including every action/subtree digest.
          diagram.actors.forEach((actor) => {
            actor.order = bundle.views.sequence.alignment.actorOrder.indexOf(actor.id);
          });
          const ordinary: unknown = JSON.parse(
            format(FormatType.JSON, diagram, 'comparison').diagram
          );
          expect(withoutTargets(bundle.views.sequence[side])).toEqual(ordinary);
          const actions = flatten(bundle.views.sequence[side]);
          expect(actions.some((a) => a.nodeType === 1)).toBe(loops);
          expect(
            bundle.views.sequence[side].actors[0].id.startsWith(expand ? 'class:' : 'package:')
          ).toBe(true);
        }
        expect(bundle.changes.map((c) => c.kind)).toEqual(['call-added']);
        expect(flatten(bundle.views.sequence.diff).some((a) => a.nodeType === 1)).toBe(false);
        const call = flatten(bundle.views.sequence.diff).find((a) => a.diffMode === 1)!;
        const display = flatten(bundle.views.sequence.head).find((a) =>
          a.eventIds.includes(call.eventIds[0])
        )!;
        expect(call.digest).not.toBe(display.digest);
      }
    }
  );
});
