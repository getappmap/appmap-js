import assert from 'assert';
import { MinPriorityQueue } from '@datastructures-js/priority-queue';
import { Action, Diagram, nodeName } from './types';
import { inspect } from 'util';

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
  cost: number;
};

export type Diff = {
  baseActions: Action[];
  headActions: Action[];
  states: State[];
};

type StateKey = string;

const InsertCost = 2.0;
const DeleteCost = 2.0;

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

export type DiffOptions = {
  verbose: false;
};

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
export default function diff(lDiagram: Diagram, rDiagram: Diagram, diffOptions: DiffOptions): Diff {
  const buildActions = (diagram: Diagram): Action[] => {
    const result: Action[] = [];
    const collectAction = (action: Action): void => {
      result.push(action);
      action.children.forEach((child) => collectAction(child));
    };
    diagram.rootActions.forEach((action) => collectAction(action));
    return result;
  };

  const lActions = buildActions(lDiagram);
  const rActions = buildActions(rDiagram);

  const advance = (diagram: Action[], action: ActionIndex): ActionIndex | undefined => {
    if (action < diagram.length - 1) return action + 1;

    return diagram.length - 1;
  };

  const advanceBoth = (state: State): State =>
    ({
      l_node: advance(lActions, state.l_node),
      r_node: advance(rActions, state.r_node),
      move: MoveType.AdvanceBoth,
      cost: 0,
    } as State);

  const deleteLeft = (state: State): State =>
    ({
      l_node: advance(lActions, state.l_node),
      r_node: state.r_node,
      move: MoveType.DeleteLeft,
      cost: DeleteCost,
    } as State);

  const insertRight = (state: State): State =>
    ({
      l_node: state.l_node,
      r_node: advance(rActions, state.r_node),
      move: MoveType.InsertRight,
      cost: InsertCost,
    } as State);

  const digestOf = (actions: Action[], action: ActionIndex): string => actions[action].digest;

  /**
   * Possible moves are:
   * - If both nodes have the same digest, advance both nodes.
   * - If nodes have non-equal digest
   *    The left node is a removal
   *    The right node is an insertion
   */
  const moves = (state: State): Move[] => {
    const lDigest = digestOf(lActions, state.l_node);
    const rDigest = digestOf(rActions, state.r_node);

    if (lDigest === rDigest) {
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
    if (state.l_node === lActions.length - 1 && state.r_node === rActions.length - 1) break;

    const options = moves(state);

    options.forEach((move) => {
      const newState = move(state);
      const moveCost = newState.cost;
      const totalCost = distances.get(stateKey(state))! + moveCost;
      if (diffOptions.verbose) console.log(`Trying ${inspect(newState)}, cost = ${totalCost}`);
      if (
        distances.get(stateKey(newState)) === undefined ||
        totalCost < distances.get(stateKey(newState))!
      ) {
        if (diffOptions.verbose) {
          console.log(
            moveType(newState.move) +
              ` from ${nodeName(lActions[state.l_node])}, ${
                (rActions[state.r_node] as any)?.name
              } to ${nodeName(lActions[newState.l_node])}, ${
                (rActions[newState.r_node] as any)?.name
              }`
          );
          console.log(
            `Min cost to ${stateKey(newState)} is ${totalCost} via ${moveType(
              newState.move
            )} from ${stateKey(state)}`
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
    let nextState = [lActions.length - 1, rActions.length - 1].join(',');
    let precedingState = statePreceding.get(nextState);
    while (precedingState) {
      const [lNode, rNode] = precedingState.split(',').map(Number);
      const move = stateMoves.get(nextState);
      const state = { l_node: lNode, r_node: rNode, move } as State;
      states.push(state);
      nextState = precedingState;
      precedingState = statePreceding.get(nextState);
    }
  }
  return { baseActions: lActions, headActions: rActions, states: states.reverse() };
}
