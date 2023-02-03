import {
  actionActors,
  isLoop,
  nodeResult,
  Action,
  Actor,
  Diagram,
} from '@appland/sequence-diagram';
import assert from 'assert';
import { ActionSpec } from './ActionSpec';

type ActionId = string;

export default class DiagramSpec {
  public actions: ActionSpec[] = [];
  public parentIndex = new Map<number, number>();

  constructor(public diagram: Diagram) {
    this.actions = [];
    const lifecycleDepth: Map<ActionId, number> = new Map();
    const collectActions = (action: Action, parent?: ActionSpec): void => {
      let spec: ActionSpec;
      const [caller, callee] = actionActors(action);

      const incrementLifecycleDepth = (actor: Actor | undefined): void => {
        assert(actor);
        const depth = lifecycleDepth.get(actor.id) || 0;
        lifecycleDepth.set(actor.id, depth + 1);
      };

      const decrementLifecycleDepth = (actor: Actor | undefined): void => {
        assert(actor);
        const depth = lifecycleDepth.get(actor.id);
        assert(depth !== undefined);
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
    assert(parent, `No parent found for action spec ${actionSpec.index}`);
    return parent;
  }
}
