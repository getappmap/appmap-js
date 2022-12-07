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
};

const Costs: Map<MoveType, number> = new Map();

Costs.set(MoveType.InsertRight, 2.0);
Costs.set(MoveType.DeleteLeft, 2.0);
Costs.set(MoveType.AdvanceBoth, 0);

export class Move {
  public lNode: number;
  public rNode: number;
  public cost: number;

  constructor(position: Position, public moveType: MoveType) {
    this.lNode = position.lNode;
    this.rNode = position.rNode;
    const cost = Costs.get(moveType);
    assert(cost !== undefined, `No cost for ${moveType}`);
    this.cost = cost;
  }
}

export type Diff = {
  baseActions: Action[];
  headActions: Action[];
  moves: Move[];
};

type StateKey = string;

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

  const advanceBoth = (move: Move): Move | undefined => {
    const [lNode, rNode] = [advance(lActions, move.lNode), advance(rActions, move.rNode)];
    if (lNode === undefined || rNode === undefined) return;

    const lDigest = digestOf(lActions, lNode);
    const rDigest = digestOf(rActions, rNode);

    // Advancing both is only a legal move if both resulting actions have the same digest.
    if (lDigest !== rDigest) return;

    return new Move(
      {
        lNode: lNode,
        rNode: rNode,
      },
      MoveType.AdvanceBoth
    );
  };

  const deleteLeft = (move: Move): Move | undefined => {
    const lNode = advance(lActions, move.lNode);
    if (lNode === undefined) return;

    return new Move({ lNode: lNode, rNode: move.rNode }, MoveType.DeleteLeft);
  };

  const insertRight = (move: Move): Move | undefined => {
    const rNode = advance(rActions, move.rNode);
    if (rNode === undefined) return;

    return new Move(
      {
        lNode: move.lNode,
        rNode: rNode,
      },
      MoveType.InsertRight
    );
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
  const possibleMoves = (move: Move): Move[] => {
    return [advanceBoth(move), deleteLeft(move), insertRight(move)].filter(Boolean) as Move[];
  };

  const pq = new MinPriorityQueue<{
    position: Move;
    preceding: Move;
    cost: number;
  }>((entry) => entry.cost);

  const distances = new Map<StateKey, number>();
  const stateMoves = new Map<StateKey, number>();
  const statePreceding = new Map<StateKey, StateKey>();

  const initialState = { lNode: -1, rNode: -1, moveType: MoveType.AdvanceBoth } as Move;
  possibleMoves(initialState).forEach((position) =>
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

      possibleMoves(position).forEach((newPosition) =>
        pq.enqueue({
          position: newPosition,
          preceding: position,
          cost: totalCost + newPosition.cost,
        })
      );
    }
  }

  const moves: Move[] = [];
  {
    let reachedState: string | undefined = [lActions.length - 1, rActions.length - 1].join(',');
    while (reachedState !== '-1,-1') {
      assert(reachedState);
      const [lNode, rNode] = reachedState.split(',').map(Number);
      const move = stateMoves.get(reachedState);
      const state = { lNode: lNode, rNode: rNode, moveType: move } as Move;
      moves.push(state);
      reachedState = statePreceding.get(reachedState);
    }
  }
  return { baseActions: lActions, headActions: rActions, moves: moves.reverse() };
}
