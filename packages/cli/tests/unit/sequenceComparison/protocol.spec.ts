import type { Move } from '@appland/sequence-diagram';
const sequence = require('@appland/sequence-diagram') as typeof import('@appland/sequence-diagram');
import { buildComparisonBundle } from '../../../src/cmds/sequenceDiagramCompare';
import { ownedFixture, recording } from './support';
let fixture: Awaited<ReturnType<typeof ownedFixture>>;
beforeEach(async () => {
  fixture = await ownedFixture();
  await fixture.put(recording([{ name: 'a' }]), recording([{ name: 'b' }]));
});
afterEach(async () => {
  jest.restoreAllMocks();
  await fixture.clean();
});
describe('Given the upstream diff protocol', () => {
  it.each([
    ['unknown operation', 99, 0, 0],
    ['missing base action', sequence.MoveType.Change, 99, 0],
    ['missing head action', sequence.MoveType.InsertRight, -1, 99],
    ['fractional action index', sequence.MoveType.Change, 0.5, 0],
  ])(
    'When %s is received Then fail closed with an adapter error',
    async (_name, moveType, lNode, rNode) => {
      const original = sequence.diff;
      jest.spyOn(sequence, 'diff').mockImplementation((...args) => {
        const result = original(...args);
        return { ...result, moves: [{ moveType, lNode, rNode, cost: 0 } as Move] };
      });
      await expect(buildComparisonBundle(fixture.base, fixture.head)).rejects.toThrow(
        /comparison diff/i
      );
    }
  );
});
