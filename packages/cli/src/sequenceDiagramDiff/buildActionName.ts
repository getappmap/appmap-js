import { Actor, actionActors, isFunction, Action, nodeName } from '@appland/sequence-diagram';

export function buildActionName(action: Action): string | undefined {
  const actor: Actor | undefined = actionActors(action)[1];
  if (!actor) return;

  const separator = isFunction(action) ? (action.static ? '.' : '#') : '#';
  return [actor.id, nodeName(action).replace(/\n/g, ' ')].join(separator);
}
