import assert from 'assert';
import { MinPriorityQueue } from '@datastructures-js/priority-queue';
import { Action, Actor, Diagram, isRequest } from './types';
import { inspect } from 'util';
import { verbose } from '../utils';

type ActionIndex = number;

type Move = (state: State) => State;

export enum MoveType {
  AdvanceBoth = 1,
  DeleteLeft = 2,
  InsertRight = 3,
}

export type State = {
  l_node: ActionIndex;
  r_node: ActionIndex;
  move: MoveType;
};

export type Diff = {
  baseActions: Action[];
  headActions: Action[];
  states: State[];
};

type StateKey = string;

function stateKey(state: State): string {
  return `${state.l_node || ''},${state.r_node || ''}`;
}

function moveType(moveType: MoveType): string {
  switch (moveType) {
    case MoveType.AdvanceBoth:
      return 'advance both';
    case MoveType.DeleteLeft:
      return 'delete left';
    case MoveType.InsertRight:
      return 'insert right';
  }
}

function stateCost(state: State): number {
  switch (state.move) {
    case MoveType.AdvanceBoth:
      return 0;
    default:
      return 1;
  }
}

/**
 * Start with the graph state equal to the (0, 0) node of each Diagram.
 * Initialize cost of the initial state to 0.
 * Enqueue the initial state.
 * Pull the lowest cost state from the queue
 * For each neighbor state:
 *    Compute the cost of the neighbor state
 *    If the current cost is undefined, or the computed cost is less than the current cost
 *      Store the step to the neighbor state
 *      Store the minimum cost of that state in the queue
 *
 */
export default function diff(l_diagram: Diagram, r_diagram: Diagram): Diff {
  const buildActions = (diagram: Diagram): Action[] => {
    const result: Action[] = [];
    const collectAction = (action: Action): void => {
      result.push(action);
      action.children.forEach((child) => collectAction(child));
    };
    diagram.rootActions.forEach((action) => collectAction(action));
    return result;
  };

  const l_actions = buildActions(l_diagram);
  const r_actions = buildActions(r_diagram);

  const advance = (diagram: Action[], action: ActionIndex): ActionIndex | undefined => {
    if (action < diagram.length - 1) return action + 1;

    return diagram.length - 1;
  };

  const advanceBoth = (state: State): State =>
    ({
      l_node: advance(l_actions, state.l_node),
      r_node: advance(r_actions, state.r_node),
      move: MoveType.AdvanceBoth,
    } as State);

  const deleteLeft = (state: State): State =>
    ({
      l_node: advance(l_actions, state.l_node),
      r_node: state.r_node,
      move: MoveType.DeleteLeft,
    } as State);

  const insertRight = (state: State): State =>
    ({
      l_node: state.l_node,
      r_node: advance(r_actions, state.r_node),
      move: MoveType.InsertRight,
    } as State);

  const digestOf = (actions: Action[], action: ActionIndex): string => actions[action].detailDigest;

  /**
   * Possible moves are:
   * - If both nodes have the same digest, advance both nodes.
   * - If nodes have non-equal digest
   *    The left node is a removal
   *    The right node is an insertion
   */
  const moves = (state: State): Move[] => {
    const l_digest = digestOf(l_actions, state.l_node);
    const r_digest = digestOf(r_actions, state.r_node);

    if (l_digest === r_digest) {
      return [advanceBoth];
    } else {
      return [deleteLeft, insertRight];
    }
  };

  const pq = new MinPriorityQueue<{ state: State; cost: number }>((entry) => entry.cost);
  const initialState = { l_node: 0, r_node: 0, move: MoveType.AdvanceBoth } as State;
  const distances = new Map<StateKey, number>();
  const stateMoves = new Map<StateKey, number>();
  const statePreceding = new Map<StateKey, StateKey>();

  distances.set(stateKey(initialState), 0);
  stateMoves.set(stateKey(initialState), MoveType.AdvanceBoth);

  pq.enqueue({ state: initialState, cost: 0 });

  while (!pq.isEmpty()) {
    const { state } = pq.dequeue();
    assert(state, 'next state');
    if (state.l_node === l_actions.length - 1 && state.r_node === r_actions.length - 1) break;

    moves(state).forEach((move) => {
      const newState = move(state);
      const moveCost = stateCost(newState);
      const totalCost = distances.get(stateKey(state))! + moveCost;
      if (verbose()) console.log(`Trying ${inspect(newState)}, cost = ${totalCost}`);
      if (
        distances.get(stateKey(newState)) === undefined ||
        totalCost < distances.get(stateKey(newState))!
      ) {
        if (verbose()) {
          console.log(
            moveType(newState.move) +
              ` from ${(l_actions[state.l_node] as any)?.name}, ${
                (r_actions[state.r_node] as any)?.name
              } to ${(l_actions[newState.l_node] as any)?.name}, ${
                (r_actions[newState.r_node] as any)?.name
              }`
          );
          console.log(
            `Min cost to ${stateKey(newState)} is ${totalCost} via ${moveType(newState.move)}`
          );
        }
        distances.set(stateKey(newState), totalCost);
        stateMoves.set(stateKey(newState), newState.move);
        statePreceding.set(stateKey(newState), stateKey(state));

        pq.enqueue({ state: newState, cost: totalCost });
      }
    });
  }

  const states: State[] = [];
  {
    let nextState = [l_actions.length - 1, r_actions.length - 1].join(',');
    let precedingState = statePreceding.get(nextState);
    while (precedingState) {
      const [l_node, r_node] = precedingState.split(',').map(Number);
      const move = stateMoves.get(nextState);
      const state = { l_node, r_node, move } as State;
      states.push(state);
      nextState = precedingState;
      precedingState = statePreceding.get(nextState);
    }
  }
  return { baseActions: l_actions, headActions: r_actions, states: states.reverse() };
}
