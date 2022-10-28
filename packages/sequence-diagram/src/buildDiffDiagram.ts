import { Diff, MoveType, State } from './diff';
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

  const buildActions = (state: State): Action => {
    const l_action = diff.baseActions[state.l_node];
    const r_action = diff.headActions[state.r_node];

    switch (state.move) {
      case MoveType.AdvanceBoth: {
        const action = cloneAction(r_action);
        if (r_action.parent) {
          const parent = diffActionsByAction.get(r_action.parent);
          parent?.children.push(action);
          action.parent = parent;
        }
        diffActionsByAction.set(r_action, action);
        diffActionsByAction.set(l_action, action);
        return action;
      }
      case MoveType.DeleteLeft: {
        const action = cloneAction(l_action);
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
          if (!l_action.parent) return undefined;

          return diffActionsByAction.get(l_action.parent);
        };

        // Case b)
        const headEquivalentOfDeletedActionsParent = (): Action | undefined => {
          if (!r_action.parent) return undefined;

          return diffActionsByAction.get(r_action.parent);
        };

        const parent = headEquivalentOfDeletedActionsParent() || deletedActionsParent();
        if (parent) {
          parent.children.splice(parent.children.length, 0, action);
          action.parent = parent;
        }

        diffActionsByAction.set(l_action, action);
        return action;
      }
      case MoveType.InsertRight: {
        const action = cloneAction(r_action);
        action.diffMode = DiffMode.Insert;
        if (r_action.parent) {
          const parent = diffActionsByAction.get(r_action.parent);
          parent?.children.push(action);
          action.parent = parent;
        }
        diffActionsByAction.set(r_action, action);
        return action;
      }
    }
  };

  const actions = diff.states.map((state) => buildActions(state));

  const uniqueActorIds = new Set<string>();
  const actors: Actor[] = [];
  actions
    .map((action) => actionActors(action))
    .flat()
    .forEach((actor) => {
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
