import { join } from 'path';
import { Action, NodeType } from '@appland/sequence-diagram';
import { buildComparisonBundle as sourceBuild } from '../../../src/cmds/sequenceDiagramCompare';
import { flatten } from '../../../src/cmds/sequenceComparison/actions';
import { loadRecording } from '../../../src/cmds/sequenceComparison/input';
import { ownedFixture, recording } from './support';
import { scenarios } from './gherkin';
const sequence = require('@appland/sequence-diagram') as typeof import('@appland/sequence-diagram');
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
  jest.restoreAllMocks();
  await fixture.clean();
});
describe.each([
  ['source', sourceBuild],
  ['compiled', compiledBuild],
] as const)('Gherkin fail-closed projection via %s public API', (entry, build) => {
  it.each(scenarios(join(__dirname, 'features/projection.feature')))(
    '$name',
    async ({ name, steps }) => {
      let attempted: Promise<unknown> | undefined;
      let invalidReferences: (() => void)[] = [];
      for (const step of steps) {
        if (step === 'Given authentic recordings with overlapping base and head event IDs') {
          await fixture.put(
            recording([{ name: 'parent', children: [{ name: 'a' }, { name: 'a' }] }]),
            recording([{ name: 'parent', children: [{ name: 'a' }, { name: 'b' }] }])
          );
        } else if (step === `When the requested display or reference has ${name}`) {
          if (name === 'existing-wrong-target') {
            const { DisplayProjection } = require(
              entry === 'source'
                ? '../../../src/cmds/sequenceComparison/projection'
                : '../../../built/cmds/sequenceComparison/projection'
            ) as typeof import('../../../src/cmds/sequenceComparison/projection');
            const appmap = await loadRecording(fixture.head);
            const diagram = sequence.buildDiagram(
              fixture.head,
              appmap,
              sequence.Specification.build(appmap, { loops: false })
            );
            flatten(diagram).forEach((action, i) => {
              action.elementId = `view:${i}`;
            });
            const index = new DisplayProjection(diagram);
            const actions = flatten(diagram).filter(
              (x): x is Action & { elementId: string } =>
                x.nodeType === NodeType.Function && Boolean(x.elementId)
            );
            expect(() =>
              index.verify({ elementIds: [actions[1].elementId], eventIds: actions[1].eventIds })
            ).not.toThrow();
            invalidReferences = [
              () =>
                index.verify({ elementIds: [actions[0].elementId], eventIds: actions[1].eventIds }),
              () => index.verify({ elementIds: [actions[1].elementId], eventIds: [999] }),
            ];
          } else {
            const original = sequence.buildDiagram;
            jest.spyOn(sequence, 'buildDiagram').mockImplementation((file, appmap, spec) => {
              const diagram = original(file, appmap, spec);
              if (name === 'unsupported-kind') {
                if (!spec.loops)
                  Object.assign(diagram.rootActions[0], { nodeType: NodeType.Conditional });
              } else if (file === fixture.head && spec.loops) {
                const action = flatten(diagram).find((x) => x.eventIds.includes(4))!;
                if (name === 'ambiguous')
                  diagram.rootActions.push({ ...action, parent: undefined, children: [] });
                else if (name === 'missing' || name === 'foreign')
                  action.eventIds = name === 'missing' ? [] : [999];
                else throw new Error(`Unbound projection case: ${name}`);
              }
              return diagram;
            });
            attempted = build(fixture.base, fixture.head);
          }
        } else if (step === 'Then the producer refuses invalid projection') {
          if (name === 'existing-wrong-target') {
            expect(invalidReferences).toHaveLength(2);
            invalidReferences.forEach((check) => expect(check).toThrow(/comparison.*membership/i));
          } else {
            expect(attempted).toBeDefined();
            await expect(attempted).rejects.toThrow(
              name === 'unsupported-kind'
                ? /Unsupported comparison semantic action type/
                : /comparison.*(membership|projection)/i
            );
          }
        } else throw new Error(`Unbound Gherkin step: ${step}`);
      }
    }
  );
});
