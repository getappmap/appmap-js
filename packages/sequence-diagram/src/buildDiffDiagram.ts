import assert from 'assert';
import { Diff, MoveType, Move } from './diff';
import { Action, actionActors, Actor, Diagram, DiffMode } from './types';

function cloneAction(action: Action): Action {
  const parent = action.parent;
  const children = action.children;
  const subtreeDigest = action.subtreeDigest;

  action.parent = undefined;
  action.children = [];
  action.subtreeDigest = 'unknown';

  const result = JSON.parse(JSON.stringify(action)) as Action;

  action.parent = parent;
  action.children = children;
  action.subtreeDigest = subtreeDigest;

  return result;
}

export default function buildDiffDiagram(diff: Diff): Diagram {
  const diffActionsByAction = new Map<Action, Action>();

  const buildActions = (state: Move): Action => {
    const lAction = diff.baseActions[state.lNode];
    const rAction = diff.headActions[state.rNode];

    switch (state.moveType) {
      case MoveType.AdvanceBoth: {
        const action = cloneAction(rAction);
        if (rAction.parent) {
          const parent = diffActionsByAction.get(rAction.parent);
          parent?.children.push(action);
          action.parent = parent;
        }
        diffActionsByAction.set(rAction, action);
        diffActionsByAction.set(lAction, action);
        return action;
      }
      case MoveType.DeleteLeft: {
        const action = cloneAction(lAction);
        action.diffMode = DiffMode.Delete;
        action.digest = ['delete', action.digest].join(':');

        // The parent of a deleted action is the cloned action of:
        //
        //   a) If the deleted action is a child of a deleted action, the deleted action's parent.
        //      Append to the children.
        //   b) If the deleted action is not a child of a deleted action, the Head equivalent of the
        //      deleted action's parent.

        // Case a)
        const deletedActionsParent = (): Action | undefined => {
          if (!lAction.parent) return undefined;

          return diffActionsByAction.get(lAction.parent);
        };

        // Case b)
        const headEquivalentOfDeletedActionsParent = (): Action | undefined => {
          if (!rAction.parent) return undefined;

          return diffActionsByAction.get(rAction.parent);
        };

        const parent = deletedActionsParent() || headEquivalentOfDeletedActionsParent();
        if (parent) {
          parent.children.splice(parent.children.length, 0, action);
          action.parent = parent;
        }

        diffActionsByAction.set(lAction, action);
        return action;
      }
      case MoveType.InsertRight: {
        const action = cloneAction(rAction);
        action.diffMode = DiffMode.Insert;
        if (rAction.parent) {
          const parent = diffActionsByAction.get(rAction.parent);
          parent?.children.push(action);
          action.parent = parent;
        }
        diffActionsByAction.set(rAction, action);
        return action;
      }
    }
  };

  const actions = diff.moves.map((state) => buildActions(state));

  const uniqueActorIds = new Set<string>();
  const actors: Actor[] = [];
  actions
    .map((action) => actionActors(action))
    .flat()
    .filter(Boolean)
    .forEach((actor) => {
      assert(actor);
      if (!uniqueActorIds.has(actor.id)) {
        uniqueActorIds.add(actor.id);
        actors.push(actor);
      }
    });
  actors.sort((a, b) => a.order - b.order);

  const rootActions = actions.filter((action) => !action.parent);

  return {
    actors,
    rootActions,
  } as Diagram;
}
