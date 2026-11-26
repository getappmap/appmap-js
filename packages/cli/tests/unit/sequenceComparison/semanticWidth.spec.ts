import { join } from 'path';
import { Action, Diagram, NodeType } from '@appland/sequence-diagram';
import { assignSemanticDigests as sourceHash } from '../../../src/cmds/sequenceComparison/semantics';

function wideDiagram(): Diagram {
  const actor = { id: 'service', name: 'Service', order: 0 };
  const call = (name: string, id: number): Action => ({
    nodeType: NodeType.Function,
    name,
    callee: actor,
    static: false,
    stableProperties: {},
    digest: `original-${name}`,
    subtreeDigest: 'original',
    eventIds: [id],
    children: [],
  });
  const root = call('parent', 1);
  root.children = Array.from({ length: 9998 }, (_, i) => call('leaf', i + 2));
  root.children.forEach((child) => {
    child.parent = root;
  });
  return { actors: [actor], rootActions: [root] };
}

describe.each(['source', 'compiled'] as const)(
  'Gherkin wide semantic hashing via %s API',
  (entry) => {
    it('Given 9999 representable actions, when hashing a wide subtree, then preserve ordered identity without exceeding the public value-identity budget', () => {
      const hash: typeof sourceHash =
        entry === 'source'
          ? sourceHash
          : (
              require(join(__dirname, '../../../built/cmds/sequenceComparison/semantics')) as {
                assignSemanticDigests: typeof sourceHash;
              }
            ).assignSemanticDigests;
      const diagram = wideDiagram();
      expect(() => hash(diagram)).not.toThrow();
      expect(diagram.rootActions[0].subtreeDigest).toMatch(/^[0-9a-f]{64}$/);
      const changed = wideDiagram();
      changed.rootActions[0].children[9997].digest = 'different-original';
      hash(changed);
      expect(changed.rootActions[0].subtreeDigest).not.toBe(diagram.rootActions[0].subtreeDigest);
    });
  }
);
