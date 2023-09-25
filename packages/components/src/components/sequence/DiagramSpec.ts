import {
  actionActors,
  isLoop,
  nodeResult,
  Action,
  Actor,
  Diagram,
} from '@appland/sequence-diagram';
import { ActionSpec } from './ActionSpec';

type ActionId = string;

let UniqueId = 1;

export default class DiagramSpec {
  uniqueId: number;

  public actions: ActionSpec[] = [];
  public parentIndex = new Map<number, number>();
  public visuallyReachableActors: Actor[];

  constructor(public diagram: Diagram) {
    UniqueId += 1;
    this.uniqueId = UniqueId;
    this.actions = [];
    this.visuallyReachableActors = this.diagram.actors;
    const lifecycleDepth: Map<ActionId, number> = new Map();
    const collectActions = (action: Action, parent?: ActionSpec): void => {
      let spec: ActionSpec;
      const [caller, callee] = actionActors(action);

      const incrementLifecycleDepth = (actor: Actor | undefined): void => {
        if (!actor) throw Error();
        const depth = lifecycleDepth.get(actor.id) || 0;
        lifecycleDepth.set(actor.id, depth + 1);
      };

      const decrementLifecycleDepth = (actor: Actor | undefined): void => {
        if (!actor) throw Error();
        const depth = lifecycleDepth.get(actor.id);
        if (!depth) throw Error();
        lifecycleDepth.set(actor.id, depth - 1);
      };

      const actorLifecycleDepth = (actor: Actor | undefined): number | undefined => {
        if (!actor) return;

        return lifecycleDepth.get(actor.id) || 0;
      };

      if (isLoop(action)) {
        if (action.children.length === 0) return;

        spec = new ActionSpec(this, action, 'loop', this.actions.length);
      } else {
        if (nodeResult(action)) {
          incrementLifecycleDepth(callee);
        }
        spec = new ActionSpec(
          this,
          action,
          'call',
          this.actions.length,
          actorLifecycleDepth(caller),
          actorLifecycleDepth(callee)
        );
      }
      if (parent) this.parentIndex.set(spec.index, parent.index);
      this.actions.push(spec);
      action.children.forEach((child) => collectActions(child, spec));
      if (isLoop(action)) {
        const openAction = this.actions[spec.index + 1];
        openAction.openGroup = true;
        const closeAction = this.actions[this.actions.length - 1];
        closeAction.closeGroup = true;
        spec.returnIndex = this.actions.length;
      } else {
        if (nodeResult(action)) {
          const returnSpec = new ActionSpec(
            this,
            action,
            'return',
            this.actions.length,
            actorLifecycleDepth(caller),
            actorLifecycleDepth(callee)
          );
          returnSpec.callIndex = spec.index;
          spec.returnIndex = this.actions.length;
          decrementLifecycleDepth(callee);
          this.actions.push(returnSpec);
        }
      }
    };
    diagram.rootActions.forEach((action) => collectActions(action));
  }

  parentOf(actionSpec: ActionSpec): ActionSpec | undefined {
    const parentIndex = this.parentIndex.get(actionSpec.index);
    if (parentIndex === undefined) return;

    const parent = this.actions[parentIndex];
    if (!parent) throw Error(`No parent found for action spec ${actionSpec.index}`);
    return parent;
  }

  determineVisuallyReachableActors(collapsedActions: boolean[]) {
    const result = new Set<Actor>();

    for (const actionSpec of this.actions.filter(a => a.nodeType !== 'return')) {
      // If all of the actors are visible at this point
      // no need to check remaining actions.
      if (result.size == this.actions.length)
        break;

      // If non of the ancestors of this action are collapsed
      // then this action is visible (not swallowed) and its actors
      // need to be visible.
      if (!actionSpec.isCollapsed(collapsedActions)) {
        const [callee, caller] = actionActors(actionSpec.action);

        if (callee && !result.has(callee))
          result.add(callee);

        if (caller && !result.has(caller))
          result.add(caller);
      }
    }
    // Preserve original order
    this.visuallyReachableActors = this.diagram.actors.filter(a => result.has(a));
  }
}
