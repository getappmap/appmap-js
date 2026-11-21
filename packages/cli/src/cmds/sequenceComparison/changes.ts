import {
  BehavioralChange,
  BehavioralChangeKind,
  ComparisonValue,
  ComparisonValueChange,
  makeComparisonChangeId,
  canonicalComparisonIdentity,
} from '@appland/models';
import {
  Action,
  Diagram,
  Diff,
  Move,
  MoveType,
  NodeType,
  nodeName,
  nodeResult,
} from '@appland/sequence-diagram';
import { TargetAction, family, identity, location, reference, serializedReturn } from './actions';
import { DisplayProjection } from './projection';

type Pair = { move: Move; base?: TargetAction; head?: TargetAction };
export function pairs(computed: Diff): Pair[] {
  function at(actions: Action[], index: number): Action {
    if (!Number.isSafeInteger(index) || index < 0 || !actions[index])
      throw new Error(`Invalid comparison diff action index: ${index}`);
    return actions[index];
  }
  return computed.moves.map((move) => {
    switch (move.moveType) {
      case MoveType.InsertRight:
        return { move, head: at(computed.headActions, move.rNode) };
      case MoveType.DeleteLeft:
        return { move, base: at(computed.baseActions, move.lNode) };
      case MoveType.AdvanceBoth:
      case MoveType.Change:
      case MoveType.Move:
        return {
          move,
          base: at(computed.baseActions, move.lNode),
          head: at(computed.headActions, move.rNode),
        };
      default: {
        const unsupported: never = move.moveType;
        throw new Error(`Unsupported comparison diff operation: ${String(unsupported)}`);
      }
    }
  });
}
function values(
  before: ComparisonValue | undefined,
  after: ComparisonValue | undefined
): ComparisonValueChange | undefined {
  if (before === undefined && after === undefined) return undefined;
  return { ...(before !== undefined ? { before } : {}), ...(after !== undefined ? { after } : {}) };
}
function visibleValue(action: Action): string {
  return canonicalComparisonIdentity({
    name:
      action.nodeType === NodeType.Query
        ? action.digest === 'truncatedQuery'
          ? action.query
          : action.digest
        : nodeName(action),
    result: nodeResult(action) ?? null,
    count: action.nodeType === NodeType.Loop ? action.count : null,
    returnValue: serializedReturn(action) ?? null,
  });
}

// Defensive promotion for core diff callers. Comparison-private digests already
// include return metadata before alignment. Normalized query text is never
// promoted just because its raw literals differ.
export function adaptDiff(computed: Diff): Diff {
  return {
    ...computed,
    moves: pairs(computed).map(({ move, base, head }) =>
      move.moveType === MoveType.AdvanceBoth &&
      base &&
      head &&
      visibleValue(base) !== visibleValue(head)
        ? new Move({ lNode: move.lNode, rNode: move.rNode }, MoveType.Change)
        : move
    ),
  };
}

export function buildChanges(
  alignment: Pair[],
  baseDiagram: Diagram,
  headDiagram: Diagram,
  diffOrigins: Map<string, TargetAction>,
  projection?: { base: DisplayProjection; head: DisplayProjection }
): BehavioralChange[] {
  const correspondence = new Map(
    alignment.filter((p) => p.base && p.head).map((p) => [p.base!, p.head!])
  );
  const occurrences = new Map<string, number>();
  const changes: BehavioralChange[] = [];
  for (const { move, base, head } of alignment) {
    if (move.moveType === MoveType.AdvanceBoth) continue;
    const primary = head || base;
    if (!primary) throw new Error('Missing comparison diff action');
    const status = !base ? 'added' : !head ? 'removed' : 'changed';
    let kind: BehavioralChangeKind = `${family(primary)}-${status}`;
    const details: Record<string, ComparisonValueChange | undefined> = {
      name: values(base ? nodeName(base) : undefined, head ? nodeName(head) : undefined),
      result: values(nodeResult(base), nodeResult(head)),
      returnValue: values(serializedReturn(base), serializedReturn(head)),
      count: values(
        base?.nodeType === NodeType.Loop ? base.count : undefined,
        head?.nodeType === NodeType.Loop ? head.count : undefined
      ),
    };
    if (move.moveType === MoveType.Move && base && head) {
      const sameParent = base.parent
        ? correspondence.get(base.parent) === head.parent
        : !head.parent;
      const beforeSiblings = base.parent?.children || baseDiagram.rootActions;
      const afterSiblings = head.parent?.children || headDiagram.rootActions;
      const invertedSibling =
        sameParent &&
        beforeSiblings.some((sibling) => {
          const other = correspondence.get(sibling);
          if (!other || other === head || !afterSiblings.includes(other)) return false;
          return (
            (beforeSiblings.indexOf(sibling) - beforeSiblings.indexOf(base)) *
              (afterSiblings.indexOf(other) - afterSiblings.indexOf(head)) <
            0
          );
        });
      if (primary.nodeType === NodeType.Function && invertedSibling) kind = 'call-reordered';
      details.location = {
        before: location(base, baseDiagram, projection?.base.parentElementId(base)),
        after: location(head, headDiagram, projection?.head.parentElementId(head)),
      };
    }
    const semanticIdentity = { version: 1, kind, base: identity(base), head: identity(head) };
    const digest = makeComparisonChangeId(semanticIdentity);
    const occurrence = occurrences.get(digest) || 0;
    occurrences.set(digest, occurrence + 1);
    const origin = primary.elementId;
    const overlay = origin ? diffOrigins.get(origin) : undefined;
    if (!overlay) throw new Error('Missing comparison diff target');
    const before = projection ? projection.base.project(base) : reference(base);
    const after = projection ? projection.head.project(head) : reference(head);
    const labels = [...new Set(head?.labels || base?.labels || [])].sort();
    changes.push({
      id: makeComparisonChangeId(semanticIdentity, occurrence),
      kind,
      summary: `${
        kind === 'call-reordered'
          ? 'Reordered'
          : move.moveType === MoveType.Move
            ? 'Relocated'
            : status[0].toUpperCase() + status.slice(1)
      } ${nodeName(primary)}`,
      base: before,
      head: after,
      views: { sequence: { base: before, head: after, diff: reference(overlay) } },
      details: Object.fromEntries(
        Object.entries(details).filter(
          (entry): entry is [string, ComparisonValueChange] => entry[1] !== undefined
        )
      ),
      ...(labels.length ? { labels } : {}),
    });
  }
  return changes;
}
