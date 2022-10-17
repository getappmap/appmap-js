import assert from 'assert';
import { Diff, MoveType, State } from './diff';
import {
  Action,
  actionActors,
  Actor,
  Conditional,
  countDescendants,
  Diagram,
  isConditional,
  isRequest,
  NodeType,
  parseRoute,
  Request,
  WebRequest,
} from './types';

function cloneAction(action: Action): Request {
  const parent = action.parent;
  const children = action.children;
  action.parent = undefined;
  action.children = [];

  const result = JSON.parse(JSON.stringify(action));

  action.parent = parent;
  action.children = children;

  return result;
}

type ActionCallback = (action: Action) => void;

export default function buildDiffDiagram(diff: Diff): Diagram {
  const actionMap = new Map<Action, Action>();

  const buildStateAction = (state: State): Action => {
    const l_action = diff.baseActions[state.l_node];
    const r_action = diff.headActions[state.r_node];

    if (isRequest(r_action) && r_action.name === 'page_number') {
      console.log(r_action);
    }

    const buildFromHeadAction = (customizeAction?: ActionCallback): Action => {
      const action = cloneAction(r_action);

      if (r_action.parent) {
        const parent = actionMap.get(r_action.parent);
        assert(parent, 'actionMap[parent]');
        action.parent = parent;
        parent.children.push(action);
      }

      if (customizeAction) customizeAction(action);

      actionMap.set(r_action, action);

      return action;
    };

    switch (state.move) {
      case MoveType.AdvanceBoth:
        return buildFromHeadAction();
      case MoveType.DeleteLeft: {
        const child = cloneAction(l_action);
        const action = {
          nodeType: NodeType.Conditional,
          detailDigest: ['delete', l_action.detailDigest].join(':'),
          children: [child],
          nodeName: 'alt',
          conditionName: 'delete',
        } as Conditional;
        child.parent = action;

        let parent = r_action;
        if (parent && actionMap.get(parent)) {
          action.parent = actionMap.get(parent);
          assert(action.parent);
          action.parent.children.push(action);
        }

        return action;
      }
      case MoveType.InsertRight: {
        const child = cloneAction(r_action);
        const action = {
          nodeType: NodeType.Conditional,
          detailDigest: ['insert', r_action.detailDigest].join(':'),
          children: [child],
          nodeName: 'alt',
          conditionName: 'insert',
        } as Conditional;
        child.parent = action;
        actionMap.set(r_action, action);

        if (r_action.parent) {
          action.parent = actionMap.get(r_action.parent);
          assert(action.parent, 'action.parent');
          action.parent.children.push(action);
        }

        return action;
      }
      case MoveType.ChangeFunction:
        return buildFromHeadAction((action): void => {
          (action as Request).baseName = (l_action as Request).name;
        });
      case MoveType.ChangeRequestMethod:
        return buildFromHeadAction((action): void => {
          (action as WebRequest).baseMethod = parseRoute((l_action as WebRequest).route).method;
        });
      case MoveType.ChangeRequestPath:
        return buildFromHeadAction((action): void => {
          (action as WebRequest).basePath = parseRoute((l_action as WebRequest).route).path;
        });
      case MoveType.ChangeRequestStatus:
        return buildFromHeadAction((action): void => {
          (action as WebRequest).baseStatus = (l_action as WebRequest).status;
        });
    }
  };

  const interpretState = (state: State): Action => {
    const action = buildStateAction(state);
    return action;
  };

  const actions = diff.states.map((state) => interpretState(state));

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

  const rootActions = actions.filter((action) => !action.parent);

  const mergeChanges = (action: Action): void => {
    action.children.forEach((child, index) => mergeChanges(child));

    const previousChild = action.children[0];
    for (let index = 1; index < action.children.length; index++) {
      const child = action.children[index];

      // Merge siblings of the same condition
      if (isConditional(child) && isConditional(previousChild)) {
        if (child.conditionName === previousChild.conditionName) {
          previousChild.children.concat(...child.children);
          child.children.forEach((ch) => (ch.parent = previousChild));
        }
      }
    }
  };

  rootActions.forEach((root) => mergeChanges(root));

  rootActions.forEach((root) => countDescendants(root));

  return {
    actors,
    rootActions,
  } as Diagram;
}
