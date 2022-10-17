import assert from 'assert';
import { MinPriorityQueue } from '@datastructures-js/priority-queue';
import levenshtein from 'js-levenshtein';
import { Action, Actor, Diagram, isRequest, isWebRequest, parseRoute, Request } from './types';
import { inspect } from 'util';
import { verbose } from '../utils';

type ActionIndex = number;

type Move = (state: State) => State;

export enum MoveType {
  AdvanceBoth = 1,
  DeleteLeft = 2,
  InsertRight = 3,
  ChangeFunction = 4,
  ChangeRequestMethod = 5,
  ChangeRequestPath = 6,
  ChangeRequestStatus = 7,
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
    case MoveType.ChangeFunction:
      return 'change name';
    case MoveType.ChangeRequestMethod:
      return 'change request method';
    case MoveType.ChangeRequestPath:
      return 'change request path';
    case MoveType.ChangeRequestStatus:
      return 'change request status';
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

  const deleteLeft = (state: State): State => {
    const cost = l_actions[state.l_node].descendantCount;

    return {
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

  const changeFunction = (state: State): State => {
    const baseName = (l_actions[state.l_node] as Request).name;
    const headName = (r_actions[state.r_node] as Request).name;
    const distance = levenshtein(baseName, headName) * 1.0;
    const maxLength = Math.max(baseName.length, headName.length);
    // Algorithm should prefer to add/remove function calls rather than
    // change every call to make them finally align.
    // TODO: Let's see how this works out on some more complex data.
    const cost = (distance / maxLength / InsertCost) * 4;

    return {
      l_node: advance(l_actions, state.l_node),
      r_node: advance(r_actions, state.r_node),
      move: MoveType.ChangeFunction,
      cost,
    } as State;
  };

  const changeRequestMethod = (state: State): State =>
    ({
      l_node: advance(l_actions, state.l_node),
      r_node: advance(r_actions, state.r_node),
      move: MoveType.ChangeRequestMethod,
      cost: 4,
    } as State);

  const changeRequestPath = (state: State): State =>
    ({
      l_node: advance(l_actions, state.l_node),
      r_node: advance(r_actions, state.r_node),
      move: MoveType.ChangeRequestPath,
      cost: 2,
    } as State);

  const changeRequestStatus = (state: State): State =>
    ({
      l_node: advance(l_actions, state.l_node),
      r_node: advance(r_actions, state.r_node),
      move: MoveType.ChangeRequestStatus,
      cost: 2,
    } as State);

  /**
   * Possible moves are:
   * - If both nodes have the same digest, advance both nodes.
   * - If nodes have non-equal digest
   *    The left node is a removal
   *    The right node is an insertion
   */
  const moves = (state: State): Move[] => {
    const l_action = l_actions[state.l_node];
    const r_action = r_actions[state.r_node];

    if (l_action.detailDigest === r_action.detailDigest) {
      return [advanceBoth];
    } else {
      const moves: Move[] = [];
      if (isRequest(l_action) && isRequest(r_action)) {
        moves.push(changeFunction);
      }
      if (isWebRequest(l_action) && isWebRequest(r_action)) {
        const l_route = parseRoute(l_action.route);
        const r_route = parseRoute(r_action.route);
        if (l_route.method !== r_route.method) {
          moves.push(changeRequestMethod);
        } else if (l_route.path !== r_route.path) {
          moves.push(changeRequestPath);
        }
        if (l_action.route === r_action.route && l_action.status !== r_action.status) {
          moves.push(changeRequestStatus);
        }
      }
      moves.push(insertRight);
      moves.push(deleteLeft);
      return moves;
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
      const moveCost = newState.cost;
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
