import { Diff, MoveType, State } from './diff';
import { Action, actionActors, Actor, Conditional, Diagram, NodeType } from './types';

export default function buildDiffDiagram(diff: Diff): Diagram {
  const interpretState = (state: State): Action => {
    switch (state.move) {
      case MoveType.AdvanceBoth:
        return diff.headActions[state.r_node];
      case MoveType.DeleteLeft: {
        const action = {
          nodeType: NodeType.Conditional,
          nodeName: 'alt',
          conditionName: 'delete',
          detailDigest: ['delete', diff.baseActions[state.l_node].detailDigest].join(':'),
          actors: [],
          children: [diff.baseActions[state.l_node]],
        } as Conditional;
        diff.baseActions[state.l_node].children = [];
        diff.baseActions[state.l_node].parent = action;
        return action;
      }
      case MoveType.InsertRight: {
        const action = {
          nodeType: NodeType.Conditional,
          nodeName: 'alt',
          conditionName: 'insert',
          detailDigest: ['insert', diff.headActions[state.r_node].detailDigest].join(':'),
          actors: [],
          children: [diff.headActions[state.r_node]],
        } as Conditional;
        diff.headActions[state.r_node].children = [];
        diff.headActions[state.r_node].parent = action;
        return action;
      }
    }
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

  return {
    actors,
    rootActions,
  } as Diagram;
}
