import assert from 'assert';
import { MinPriorityQueue } from '@datastructures-js/priority-queue';
import { Action, Diagram, nodeName } from './types';
import { inspect } from 'util';

type ActionIndex = number;

export enum MoveType {
  AdvanceBoth = 1,
  DeleteLeft = 2,
  InsertRight = 3,
}

export type Position = {
  lNode: ActionIndex;
  rNode: ActionIndex;
  moveType: MoveType;
  cost: number;
};

export type Diff = {
  baseActions: Action[];
  headActions: Action[];
  positions: Position[];
};

type StateKey = string;

const InsertCost = 2.0;
const DeleteCost = 2.0;

function positionKey(position: Position): string {
  return `${position.lNode},${position.rNode}`;
}

function moveTypeName(moveType: MoveType): string {
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
  verbose?: boolean;
};

/**
 * Start with the graph state (-1, -1) of each Diagram.
 * Enqueue moves from the inital state.
 * Pull the lowest cost move from the queue
 *    If the known cost to the new location is undefined, or if the cost via this move is less than the known cost
 *      Store the step to the new state
 *      Store the total cost as the minimum cost
 *      Enqueue the possible next moves
 */
export default function diff(
  baseDiagram: Diagram,
  headDiagram: Diagram,
  diffOptions: DiffOptions = {}
): Diff {
  const buildActions = (diagram: Diagram): Action[] => {
    const result: Action[] = [];
    const collectAction = (action: Action): void => {
      result.push(action);
      action.children.forEach((child) => collectAction(child));
    };
    diagram.rootActions.forEach((action) => collectAction(action));
    return result;
  };

  const lActions = buildActions(baseDiagram);
  const rActions = buildActions(headDiagram);

  const advance = (diagram: Action[], action: ActionIndex): ActionIndex | undefined => {
    if (action < diagram.length) return action + 1;
  };

  const advanceBoth = (state: Position): Position | undefined => {
    const [lNode, rNode] = [advance(lActions, state.lNode), advance(rActions, state.rNode)];
    if (lNode === undefined || rNode === undefined) return;

    const lDigest = digestOf(lActions, lNode);
    const rDigest = digestOf(rActions, rNode);

    // Advancing both is only a legal move if both resulting actions have the same digest.
    if (lDigest !== rDigest) return;

    return {
      lNode: lNode,
      rNode: rNode,
      moveType: MoveType.AdvanceBoth,
      cost: 0,
    };
  };

  const deleteLeft = (state: Position): Position | undefined => {
    const lNode = advance(lActions, state.lNode);
    if (lNode === undefined) return;

    return {
      lNode: lNode,
      rNode: state.rNode,
      moveType: MoveType.DeleteLeft,
      cost: DeleteCost,
    } as Position;
  };

  const insertRight = (state: Position): Position | undefined => {
    const rNode = advance(rActions, state.rNode);
    if (rNode === undefined) return;

    return {
      lNode: state.lNode,
      rNode: rNode,
      moveType: MoveType.InsertRight,
      cost: InsertCost,
    } as Position;
  };

  const digestOf = (actions: Action[], action: ActionIndex): string => {
    if (action === -1) return 'head';
    else if (action === actions.length) return 'tail';
    else return actions[action].digest;
  };

  /**
   * Possible moves are:
   * - If both nodes have the same digest, advance both nodes.
   * - If nodes have non-equal digest
   *    The left node is a removal
   *    The right node is an insertion
   */
  const moves = (state: Position): Position[] => {
    return [advanceBoth(state), deleteLeft(state), insertRight(state)].filter(
      Boolean
    ) as Position[];
  };

  const pq = new MinPriorityQueue<{
    position: Position;
    preceding: Position;
    cost: number;
  }>((entry) => entry.cost);

  const distances = new Map<StateKey, number>();
  const stateMoves = new Map<StateKey, number>();
  const statePreceding = new Map<StateKey, StateKey>();

  const initialState = { lNode: -1, rNode: -1, moveType: MoveType.AdvanceBoth } as Position;
  moves(initialState).forEach((position) =>
    pq.enqueue({ position, preceding: initialState, cost: position.cost })
  );

  while (!pq.isEmpty()) {
    const { position, preceding, cost: totalCost } = pq.dequeue();
    assert(position, 'next position');

    if (position.lNode === lActions.length && position.rNode === rActions.length) break;

    if (diffOptions.verbose) console.log(`Trying ${inspect(position)}, cost = ${totalCost}`);

    if (
      distances.get(positionKey(position)) === undefined ||
      totalCost < distances.get(positionKey(position))!
    ) {
      if (diffOptions.verbose) {
        console.log(
          moveTypeName(position.moveType) +
            ` from ${nodeName(lActions[preceding.lNode])}, ${
              (rActions[preceding.rNode] as any)?.name
            } to ${nodeName(lActions[position.lNode])}, ${(rActions[position.rNode] as any)?.name}`
        );
        console.log(
          `Min cost to ${positionKey(position)} is ${totalCost} via ${moveTypeName(
            position.moveType
          )} from ${positionKey(preceding)}`
        );
      }
      distances.set(positionKey(position), totalCost);
      stateMoves.set(positionKey(position), position.moveType);
      if (preceding) statePreceding.set(positionKey(position), positionKey(preceding));

      moves(position).forEach((newPosition) =>
        pq.enqueue({
          position: newPosition,
          preceding: position,
          cost: totalCost + newPosition.cost,
        })
      );
    }
  }

  const states: Position[] = [];
  {
    let reachedState: string | undefined = [lActions.length - 1, rActions.length - 1].join(',');
    while (reachedState !== '-1,-1') {
      assert(reachedState);
      const [lNode, rNode] = reachedState.split(',').map(Number);
      const move = stateMoves.get(reachedState);
      const state = { lNode: lNode, rNode: rNode, moveType: move } as Position;
      states.push(state);
      reachedState = statePreceding.get(reachedState);
    }
  }
  return { baseActions: lActions, headActions: rActions, positions: states.reverse() };
}
