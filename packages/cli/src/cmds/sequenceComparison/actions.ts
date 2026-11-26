import type { ComparisonReference, ComparisonValue } from '@appland/models';
import {
  Action,
  actionActors,
  Diagram,
  NodeType,
  nodeName,
  nodeResult,
} from '@appland/sequence-diagram';

// IDs belong to the serialized payload, not a DOM or the source event namespace.
export type TargetAction = Action & { elementId?: string };
export function flatten(diagram: Diagram): TargetAction[] {
  const result: TargetAction[] = [];
  const visit = (action: Action): void => {
    result.push(action);
    action.children.forEach(visit);
  };
  diagram.rootActions.forEach(visit);
  return result;
}
export function assignTargets(diagram: Diagram, namespace: string): Map<string, TargetAction> {
  const origins = new Map<string, TargetAction>();
  flatten(diagram).forEach((action, index) => {
    if (action.elementId) {
      if (origins.has(action.elementId)) throw new Error('Duplicate comparison diff origin');
      origins.set(action.elementId, action);
    }
    action.elementId = `${namespace}:${index + 1}`;
  });
  return origins;
}
export function reference(action: TargetAction | undefined): ComparisonReference | undefined {
  if (!action) return undefined;
  if (!action.elementId) throw new Error('Missing comparison action target');
  return {
    elementIds: [action.elementId],
    ...(action.eventIds.length ? { eventIds: [...action.eventIds] } : {}),
  };
}
export function family(action: Action): 'call' | 'query' | 'rpc' | 'control-flow' {
  const nodeType = action.nodeType;
  switch (action.nodeType) {
    case NodeType.Function:
      return 'call';
    case NodeType.Query:
      return 'query';
    case NodeType.ServerRPC:
    case NodeType.ClientRPC:
      return 'rpc';
    case NodeType.Loop:
      return 'control-flow';
    default:
      throw new Error(`Unsupported comparison action type: ${String(nodeType)}`);
  }
}
function descriptor(action: Action, semantic = false): ComparisonValue {
  return {
    nodeType: action.nodeType,
    // Identity keeps upstream SQL normalization; source-location descriptors
    // retain the raw query text, not an opaque comparison hash.
    name: semantic && action.nodeType === NodeType.Query ? action.digest : nodeName(action),
    actors: actionActors(action).map((actor) => actor?.id || null),
  };
}
export function ancestors(action: Action, semantic = false): ComparisonValue[] {
  const path: ComparisonValue[] = [];
  for (let parent = action.parent; parent; parent = parent.parent)
    path.unshift(descriptor(parent, semantic));
  return path;
}
export function serializedReturn(action: Action | undefined): ComparisonValue | undefined {
  if (action?.nodeType !== NodeType.Function || !action.returnValue) return undefined;
  return JSON.parse(JSON.stringify(action.returnValue)) as ComparisonValue;
}
function semanticProperties(action: Action) {
  return {
    descriptor: descriptor(action, true),
    digest: action.digest,
    result: nodeResult(action) ?? null,
    returnValue: serializedReturn(action) ?? null,
    count: action.nodeType === NodeType.Loop ? action.count : null,
  };
}
function bodyIdentity(action: Action): ComparisonValue {
  return { ...semanticProperties(action), children: action.children.map(bodyIdentity) };
}
export function identity(action: Action | undefined): ComparisonValue {
  if (!action) return null;
  return {
    ...semanticProperties(action),
    ancestors: ancestors(action, true),
    // A loop's own digest is the constant "loop". Its semantic body, not its
    // event numbers or position, distinguishes unrelated loop changes.
    ...(action.nodeType === NodeType.Loop ? { body: action.children.map(bodyIdentity) } : {}),
  };
}
export function location(
  action: Action,
  diagram: Diagram,
  parentElementId: string | null = (action.parent as TargetAction | undefined)?.elementId ?? null
): ComparisonValue {
  return {
    ancestors: ancestors(action),
    parentElementId,
    index: (action.parent?.children || diagram.rootActions).indexOf(action),
  };
}
