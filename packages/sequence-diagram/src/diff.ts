import { MinPriorityQueue } from '@datastructures-js/priority-queue';
import type { Action, Diagram } from './types';
import { actionActors, nodeName } from './types';

type ActionIndex = number;

export enum MoveType {
  AdvanceBoth = 1,
  DeleteLeft = 2,
  InsertRight = 3,
  Change = 4,
  // A subtree that is gone from one place in the base and present, unchanged, in another
  // place in the head. lNode is the subtree root in the base, rNode its root in the head;
  // the descendants follow as AdvanceBoth pairs.
  Move = 5,
}

export type Position = {
  lNode: ActionIndex;
  rNode: ActionIndex;
};

// Cost of one step. Deleting or inserting a subtree costs DeleteLeft/InsertRight per
// node in it, unless the same subtree exists somewhere on the other side: then it may
// be moving, and it is charged the Move cost once. A change costs more than a
// delete-plus-insert of a moving subtree, so a block that moved is never explained
// as a chain of changes, but less than deleting and inserting a single node, so a
// rename or a changed return is still a change. Matching costs the alignment of the
// children.
const Costs: Map<MoveType, number> = new Map();

Costs.set(MoveType.AdvanceBoth, 0);
Costs.set(MoveType.Change, 2.5);
Costs.set(MoveType.InsertRight, 2.0);
Costs.set(MoveType.DeleteLeft, 2.0);
Costs.set(MoveType.Move, 1.0);

export class Move {
  public lNode: number;
  public rNode: number;
  public cost: number;

  constructor(position: Position, public moveType: MoveType, cost?: number) {
    this.lNode = position.lNode;
    this.rNode = position.rNode;
    const unitCost = Costs.get(moveType);
    if (unitCost === undefined) throw Error(`No cost for ${moveType}`);
    this.cost = cost ?? unitCost;
  }
}

export type Diff = {
  baseActions: Action[];
  headActions: Action[];
  moves: Move[];
};

export type DiffOptions = {
  verbose?: boolean;
};

type Alignment = {
  cost: number;
  moves: Move[];
};

function moveTypeName(moveType: MoveType): string {
  switch (moveType) {
    case MoveType.AdvanceBoth:
      return 'advance both';
    case MoveType.DeleteLeft:
      return 'delete left';
    case MoveType.InsertRight:
      return 'insert right';
    case MoveType.Change:
      return 'change';
    case MoveType.Move:
      return 'move';
  }
}

/**
 * Diff two diagrams, respecting their tree structure.
 *
 * Nodes are matched only within the children of an already-matched pair of parents,
 * so a node can never be paired with a node under a different parent. At each level
 * the children lists are aligned by lowest cost (Dijkstra over the pair of lists):
 *
 * - advance both: the two nodes have the same digest; costs the alignment of their
 *   children (0 when the whole subtrees are identical)
 * - change: same caller, callee, and node type, different digest (a rename, a
 *   changed query, a different return); costs Change plus the children
 * - delete left / insert right: costs 2 per node in the subtree, or the Move cost
 *   when the same subtree exists anywhere on the other side
 *
 * Then a recovery pass turns a deleted subtree and an inserted subtree with the same
 * subtree digest into one Move: the block relocated unchanged. The result is in
 * head pre-order, with deleted nodes interleaved where they were, so a parent's move
 * always precedes its children's. buildDiffDiagram relies on that order.
 */
export default function diff(
  baseDiagram: Diagram,
  headDiagram: Diagram,
  diffOptions: DiffOptions = {}
): Diff {
  const flatten = (diagram: Diagram): Action[] => {
    const result: Action[] = [];
    const collect = (action: Action): void => {
      result.push(action);
      action.children.forEach((child) => collect(child));
    };
    diagram.rootActions.forEach((action) => collect(action));
    return result;
  };

  const lActions = flatten(baseDiagram);
  const rActions = flatten(headDiagram);
  const lIndex = new Map<Action, ActionIndex>(lActions.map((action, index) => [action, index]));
  const rIndex = new Map<Action, ActionIndex>(rActions.map((action, index) => [action, index]));

  const descendants = (action: Action): Action[] => {
    const result: Action[] = [];
    const collect = (child: Action): void => {
      result.push(child);
      child.children.forEach((grandchild) => collect(grandchild));
    };
    action.children.forEach((child) => collect(child));
    return result;
  };

  const sizes = new Map<Action, number>();
  const sizeOf = (action: Action): number => {
    let size = sizes.get(action);
    if (size === undefined) {
      size = 1 + descendants(action).length;
      sizes.set(action, size);
    }
    return size;
  };

  const position = (l: Action | undefined, r: Action | undefined): Position => ({
    lNode: l ? lIndex.get(l)! : -1,
    rNode: r ? rIndex.get(r)! : -1,
  });

  // Two identical subtrees, paired node by node in pre-order. The roots are
  // included; callers slice them off when they have emitted the root themselves.
  const advanceSubtree = (l: Action, r: Action): Move[] => {
    const ls = [l, ...descendants(l)];
    const rs = [r, ...descendants(r)];
    return ls.map((la, index) => new Move(position(la, rs[index]), MoveType.AdvanceBoth));
  };
  const deleteSubtree = (l: Action): Move[] =>
    [l, ...descendants(l)].map((la) => new Move(position(la, undefined), MoveType.DeleteLeft));
  const insertSubtree = (r: Action): Move[] =>
    [r, ...descendants(r)].map((ra) => new Move(position(undefined, ra), MoveType.InsertRight));

  // The children alignment of a matched pair, memoized per pair.
  const pairAlignments = new Map<string, Alignment>();
  const alignPair = (l: Action, r: Action): Alignment => {
    const key = `${lIndex.get(l)},${rIndex.get(r)}`;
    let alignment = pairAlignments.get(key);
    if (!alignment) {
      alignment =
        l.subtreeDigest === r.subtreeDigest
          ? { cost: 0, moves: advanceSubtree(l, r).slice(1) }
          : alignLists(l.children, r.children);
      pairAlignments.set(key, alignment);
    }
    return alignment;
  };

  // A change is the same call site doing something different: same caller, same
  // callee, same kind of node.
  const sameActors = (l: Action, r: Action): boolean => {
    const [lCaller, lCallee] = actionActors(l);
    const [rCaller, rCallee] = actionActors(r);
    return lCaller?.id === rCaller?.id && lCallee?.id === rCallee?.id;
  };

  // A delete or insert may be half of a move when the same subtree exists somewhere
  // on the other side, but not among the siblings being aligned: a twin there can be
  // matched in place, so this one is a plain delete or insert.
  const baseDigests = new Set(lActions.map((action) => action.subtreeDigest));
  const headDigests = new Set(rActions.map((action) => action.subtreeDigest));
  const among = (siblings: Action[], digest: string): boolean =>
    siblings.some((sibling) => sibling.subtreeDigest === digest);
  const deleteCost = (l: Action, rs: Action[]): number =>
    headDigests.has(l.subtreeDigest) && !among(rs, l.subtreeDigest)
      ? Costs.get(MoveType.Move)!
      : Costs.get(MoveType.DeleteLeft)! * sizeOf(l);
  const insertCost = (r: Action, ls: Action[]): number =>
    baseDigests.has(r.subtreeDigest) && !among(ls, r.subtreeDigest)
      ? Costs.get(MoveType.Move)!
      : Costs.get(MoveType.InsertRight)! * sizeOf(r);

  // Lowest-cost alignment of two sibling lists. A state (i, j) means i nodes of `ls`
  // and j nodes of `rs` are consumed.
  const alignLists = (ls: Action[], rs: Action[]): Alignment => {
    type Step = { i: number; j: number; moveType: MoveType; cost: number };
    const key = (i: number, j: number): string => `${i},${j}`;
    const stepsFrom = (i: number, j: number): Step[] => {
      const steps: Step[] = [];
      const l = ls[i];
      const r = rs[j];
      if (l && r && l.digest === r.digest) {
        steps.push({
          i: i + 1,
          j: j + 1,
          moveType: MoveType.AdvanceBoth,
          cost: alignPair(l, r).cost,
        });
      }
      if (l && r && l.digest !== r.digest && l.nodeType === r.nodeType && sameActors(l, r)) {
        steps.push({
          i: i + 1,
          j: j + 1,
          moveType: MoveType.Change,
          cost: Costs.get(MoveType.Change)! + alignPair(l, r).cost,
        });
      }
      if (l) steps.push({ i: i + 1, j, moveType: MoveType.DeleteLeft, cost: deleteCost(l, rs) });
      if (r) steps.push({ i, j: j + 1, moveType: MoveType.InsertRight, cost: insertCost(r, ls) });
      return steps;
    };

    const distances = new Map<string, number>();
    const settled = new Set<string>();
    const arrivedBy = new Map<string, Step & { from: string }>();
    const queue = new MinPriorityQueue<{
      i: number;
      j: number;
      cost: number;
      step?: Step & { from: string };
    }>((entry) => entry.cost);
    queue.enqueue({ i: 0, j: 0, cost: 0 });
    distances.set(key(0, 0), 0);

    while (!queue.isEmpty()) {
      const { i, j, cost, step } = queue.dequeue();
      const here = key(i, j);
      if (settled.has(here)) continue;
      settled.add(here);
      if (step) arrivedBy.set(here, step);
      if (i === ls.length && j === rs.length) break;
      for (const next of stepsFrom(i, j)) {
        const total = cost + next.cost;
        const there = key(next.i, next.j);
        const known = distances.get(there);
        if (known === undefined || total < known) {
          distances.set(there, total);
          queue.enqueue({ i: next.i, j: next.j, cost: total, step: { ...next, from: here } });
        }
      }
    }

    // Walk back from the end state and expand each step into moves.
    const path: Step[] = [];
    let state = key(ls.length, rs.length);
    while (state !== key(0, 0)) {
      const step = arrivedBy.get(state);
      if (!step) throw Error(`No path to ${state}`);
      path.push(step);
      state = step.from;
    }
    path.reverse();

    const moves: Move[] = [];
    for (const step of path) {
      const l = ls[step.i - 1];
      const r = rs[step.j - 1];
      switch (step.moveType) {
        case MoveType.AdvanceBoth:
          moves.push(new Move(position(l, r), MoveType.AdvanceBoth), ...alignPair(l, r).moves);
          break;
        case MoveType.Change:
          moves.push(new Move(position(l, r), MoveType.Change), ...alignPair(l, r).moves);
          break;
        case MoveType.DeleteLeft:
          moves.push(...deleteSubtree(l));
          break;
        case MoveType.InsertRight:
          moves.push(...insertSubtree(r));
          break;
        default:
          throw Error(`Unexpected step ${step.moveType}`);
      }
    }
    return { cost: distances.get(key(ls.length, rs.length))!, moves };
  };

  // A deleted subtree and an inserted subtree with the same subtree digest are one
  // block that moved. The delete side is dropped; the insert side becomes a Move
  // followed by the descendants as AdvanceBoth pairs, in the head's position.
  const recoverMoves = (moves: Move[]): Move[] => {
    const deleted = new Set<Action>();
    const inserted = new Set<Action>();
    for (const move of moves) {
      if (move.moveType === MoveType.DeleteLeft) deleted.add(lActions[move.lNode]);
      if (move.moveType === MoveType.InsertRight) inserted.add(rActions[move.rNode]);
    }
    const isRoot = (set: Set<Action>) => (action: Action) =>
      !action.parent || !set.has(action.parent);
    const deletedRoots = [...deleted].filter(isRoot(deleted));
    const insertedRoots = [...inserted].filter(isRoot(inserted));

    const candidates = new Map<string, Action[]>();
    for (const root of deletedRoots) {
      const list = candidates.get(root.subtreeDigest) ?? [];
      list.push(root);
      candidates.set(root.subtreeDigest, list);
    }
    const pairs = new Map<Action, Action>(); // head root -> base root
    for (const root of insertedRoots) {
      const match = candidates.get(root.subtreeDigest)?.shift();
      if (match) pairs.set(root, match);
    }
    if (pairs.size === 0) return moves;

    const movedBase = new Set<Action>();
    const movedHeadInterior = new Set<Action>();
    for (const [headRoot, baseRoot] of pairs) {
      [baseRoot, ...descendants(baseRoot)].forEach((action) => movedBase.add(action));
      descendants(headRoot).forEach((action) => movedHeadInterior.add(action));
    }

    const result: Move[] = [];
    for (const move of moves) {
      if (move.moveType === MoveType.DeleteLeft && movedBase.has(lActions[move.lNode])) continue;
      if (move.moveType === MoveType.InsertRight) {
        const headAction = rActions[move.rNode];
        const baseRoot = pairs.get(headAction);
        if (baseRoot) {
          result.push(new Move(position(baseRoot, headAction), MoveType.Move));
          result.push(...advanceSubtree(baseRoot, headAction).slice(1));
          continue;
        }
        if (movedHeadInterior.has(headAction)) continue;
      }
      result.push(move);
    }
    return result;
  };

  const alignment = alignLists(baseDiagram.rootActions, headDiagram.rootActions);
  const moves = recoverMoves(alignment.moves);

  if (diffOptions.verbose) {
    console.log(`Alignment cost ${alignment.cost}`);
    for (const move of moves) {
      console.log(
        `${moveTypeName(move.moveType)}: ${nodeName(lActions[move.lNode])} / ${nodeName(
          rActions[move.rNode]
        )}`
      );
    }
  }

  return { baseActions: lActions, headActions: rActions, moves };
}
