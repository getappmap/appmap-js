import { createHash } from 'crypto';
import { canonicalComparisonIdentity, ComparisonValue } from '@appland/models';
import { Action, actionActors, Diagram, NodeType } from '@appland/sequence-diagram';
import { serializedReturn } from './actions';

function hash(value: ComparisonValue): string {
  return createHash('sha256').update(canonicalComparisonIdentity(value)).digest('hex');
}
function properties(action: Action): ComparisonValue {
  const common = {
    nodeType: action.nodeType,
    actors: actionActors(action).map((actor) => actor?.id ?? null),
    // Preserve upstream stable properties, notably SQL literal normalization.
    digest: action.digest,
  };
  switch (action.nodeType) {
    case NodeType.Function:
      return {
        ...common,
        name: action.name,
        static: action.static ?? false,
        returnValue: serializedReturn(action) ?? null,
      };
    case NodeType.Query:
      // Only this constant digest loses query meaning. Ordinary SQL must NOT
      // include raw text: changing a literal is not a behavioral query change.
      return { ...common, ...(action.digest === 'truncatedQuery' ? { query: action.query } : {}) };
    case NodeType.ServerRPC:
    case NodeType.ClientRPC:
      return { ...common, route: action.route, status: action.status ?? null };
    default:
      throw new Error(`Unsupported comparison semantic action type: ${action.nodeType}`);
  }
}
// Call only on independently built, uncompressed comparison-private diagrams.
// Neither the sequence-core digests nor the display diagrams are modified.
export function assignSemanticDigests(diagram: Diagram): void {
  const visit = (action: Action): void => {
    action.digest = hash(properties(action));
    action.children.forEach(visit);
    // Stream fixed-width child hashes instead of passing an arbitrarily wide
    // tree through the public per-value identity encoder's defensive budget.
    const subtree = createHash('sha256').update('comparison-subtree-v1\0');
    subtree.update(action.digest).update(`\0${action.children.length}\0`);
    action.children.forEach((child) => subtree.update(child.subtreeDigest));
    action.subtreeDigest = subtree.digest('hex');
  };
  diagram.rootActions.forEach(visit);
}
