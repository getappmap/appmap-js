// Build small diagrams from indented text, so a diff test can state its input and
// its expected output in the same shape:
//
//   Users#show                 instance method `show` on actor `Users`
//     Users.find               static method
//       SQL SELECT * FROM u    query, callee is the database
//     GET /users               server request
//     loop                     a loop node
//
// Digests follow buildDiagram: a node's digest is its identity, its subtree digest is
// a hash of its digest and its children's subtree digests, so two identical subtrees
// anywhere have the same subtree digest and two different ones do not.

import { createHash } from 'crypto';
import buildDiffDiagram from '../src/buildDiffDiagram';
import diff, { Move, MoveType } from '../src/diff';
import type { Action, Actor, Diagram, FunctionCall, Loop, Query, ServerRPC } from '../src/types';
import { DiffMode, NodeType, nodeName, setParent } from '../src/types';

const actors = new Map<string, Actor>();
function actor(id: string, name: string): Actor {
  let result = actors.get(id);
  if (!result) {
    result = { id, name, order: actors.size + 1 };
    actors.set(id, result);
  }
  return result;
}

function node(label: string, caller: Actor | undefined): Action {
  const base = { children: [] as Action[], eventIds: [], subtreeDigest: '' };
  if (label === 'loop') {
    return { ...base, nodeType: NodeType.Loop, count: 2, digest: 'loop' } as Loop;
  }
  if (label.startsWith('SQL ')) {
    const query = label.slice(4);
    return {
      ...base,
      nodeType: NodeType.Query,
      caller: caller ?? actor('class:Root', 'Root'),
      callee: actor('database:Database', 'Database'),
      query,
      digest: `sql:${query}`,
    } as Query;
  }
  const request = label.match(/^(GET|POST|PUT|DELETE) (.+)$/);
  if (request) {
    return {
      ...base,
      nodeType: NodeType.ServerRPC,
      callee: actor('http:HTTP', 'HTTP'),
      route: label,
      status: 200,
      digest: `http:${label}`,
    } as ServerRPC;
  }
  const call = label.match(/^([A-Za-z0-9_]+)([#.])(.+)$/);
  if (!call) throw Error(`Cannot parse node label '${label}'`);
  const [, className, separator, name] = call;
  return {
    ...base,
    nodeType: NodeType.Function,
    caller,
    callee: actor(`class:${className}`, className),
    name,
    static: separator === '.',
    stableProperties: { id: `${className}${separator}${name}` },
    digest: `fn:${label}`,
  } as FunctionCall;
}

function digestSubtree(action: Action): void {
  action.children.forEach(digestSubtree);
  const hash = createHash('sha256');
  hash.update([action.digest, ...action.children.map((child) => child.subtreeDigest)].join('\n'));
  action.subtreeDigest = hash.digest('hex');
}

export function buildTree(text: string): Diagram {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  const indentOf = (line: string): number => line.match(/^ */)![0].length;
  const baseIndent = Math.min(...lines.map(indentOf));
  const rootActions: Action[] = [];
  const stack: { depth: number; action: Action }[] = [];
  for (const line of lines) {
    const depth = (indentOf(line) - baseIndent) / 2;
    if (!Number.isInteger(depth)) throw Error(`Indent must be two spaces per level: '${line}'`);
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) stack.pop();
    const parent = stack[stack.length - 1]?.action;
    const callerActor = parent ? (parent as FunctionCall).callee : undefined;
    const action = node(line.trim(), callerActor);
    if (parent) parent.children.push(action);
    else rootActions.push(action);
    stack.push({ depth, action });
  }
  rootActions.forEach(digestSubtree);
  rootActions.forEach((root) => setParent(root));
  const diagramActors = [...new Set(rootActions.flatMap(collectActors))];
  return { actors: diagramActors, rootActions };
}

function collectActors(action: Action): Actor[] {
  const own = [(action as FunctionCall).caller, (action as FunctionCall).callee].filter(
    Boolean
  ) as Actor[];
  return [...own, ...action.children.flatMap(collectActors)];
}

// The diff diagram back as indented text, with a marker per changed node:
// [+] added, [-] removed, [~] changed, [> from X] moved from X.
export function renderTree(diagram: Diagram): string {
  const lines: string[] = [];
  const walk = (action: Action, depth: number): void => {
    let marker = '';
    switch (action.diffMode) {
      case DiffMode.Insert:
        marker = ' [+]';
        break;
      case DiffMode.Delete:
        marker = ' [-]';
        break;
      case DiffMode.Change:
        marker = ` [~ was ${action.formerName}]`;
        break;
      case DiffMode.Move:
        marker = ` [> from ${action.movedFrom ?? 'top'}]`;
        break;
    }
    lines.push(`${'  '.repeat(depth)}${label(action)}${marker}`);
    action.children.forEach((child) => walk(child, depth + 1));
  };
  diagram.rootActions.forEach((root) => walk(root, 0));
  return lines.join('\n');
}

export function label(action: Action): string {
  switch (action.nodeType) {
    case NodeType.Function:
      return `${action.callee.name}${action.static ? '.' : '#'}${action.name}`;
    case NodeType.Query:
      return `SQL ${action.query}`;
    default:
      return nodeName(action);
  }
}

export function diffTrees(
  base: string,
  head: string
): { moves: Move[]; diagram: Diagram; base: Diagram; head: Diagram } {
  const baseDiagram = buildTree(base);
  const headDiagram = buildTree(head);
  const result = diff(baseDiagram, headDiagram);
  return {
    moves: result.moves,
    diagram: buildDiffDiagram(result),
    base: baseDiagram,
    head: headDiagram,
  };
}

export function countMoves(moves: Move[]): Record<string, number> {
  const counts: Record<string, number> = { advance: 0, insert: 0, delete: 0, change: 0, move: 0 };
  for (const move of moves) {
    switch (move.moveType) {
      case MoveType.AdvanceBoth:
        counts.advance += 1;
        break;
      case MoveType.InsertRight:
        counts.insert += 1;
        break;
      case MoveType.DeleteLeft:
        counts.delete += 1;
        break;
      case MoveType.Change:
        counts.change += 1;
        break;
      case MoveType.Move:
        counts.move += 1;
        break;
    }
  }
  return counts;
}

// Strip leading indentation shared by every line, so expected trees can be written
// inline in a test.
export function tree(text: string): string {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  const indent = Math.min(...lines.map((line) => line.match(/^ */)![0].length));
  return lines.map((line) => line.slice(indent)).join('\n');
}

// ---------------------------------------------------------------------------
// Random trees and edits, for property tests
// ---------------------------------------------------------------------------

// Deterministic PRNG (mulberry32), so a failing case can be replayed by seed.
export function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type TreeSpec = { label: string; children: TreeSpec[] };

// `labels` small means repeated subtrees, which is the hard case for matching.
export function randomTree(
  random: () => number,
  options: { depth: number; fanout: number; labels: string[] }
): TreeSpec[] {
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)];
  const build = (depth: number): TreeSpec => ({
    label: pick(options.labels),
    children:
      depth <= 0
        ? []
        : Array.from({ length: Math.floor(random() * (options.fanout + 1)) }, () =>
            build(depth - 1)
          ),
  });
  return Array.from({ length: 1 + Math.floor(random() * options.fanout) }, () =>
    build(options.depth)
  );
}

export function specToText(roots: TreeSpec[]): string {
  const lines: string[] = [];
  const walk = (spec: TreeSpec, depth: number): void => {
    lines.push(`${'  '.repeat(depth)}${spec.label}`);
    spec.children.forEach((child) => walk(child, depth + 1));
  };
  roots.forEach((root) => walk(root, 0));
  return lines.join('\n');
}

export function cloneSpec(roots: TreeSpec[]): TreeSpec[] {
  return JSON.parse(JSON.stringify(roots)) as TreeSpec[];
}

type Slot = { list: TreeSpec[]; index: number; parentLabel?: string };

// Every position a subtree sits in: (its sibling list, its index).
export function slots(roots: TreeSpec[]): Slot[] {
  const result: Slot[] = [];
  const walk = (list: TreeSpec[], parentLabel?: string): void => {
    list.forEach((spec, index) => {
      result.push({ list, index, parentLabel });
      walk(spec.children, spec.label);
    });
  };
  walk(roots);
  return result;
}

function contains(spec: TreeSpec, target: TreeSpec): boolean {
  return spec === target || spec.children.some((child) => contains(child, target));
}

// Apply one random edit in place. Returns what was done, for assertions.
export function randomEdit(
  random: () => number,
  roots: TreeSpec[],
  labels: string[]
): { kind: 'insert' | 'delete' | 'move'; size: number } {
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)];
  const size = (spec: TreeSpec): number =>
    1 + spec.children.reduce((sum, child) => sum + size(child), 0);
  const all = slots(roots);
  // An empty tree can only grow.
  const kind = all.length === 0 ? 'insert' : pick(['insert', 'delete', 'move'] as const);
  if (kind === 'insert') {
    const subtree = randomTree(random, { depth: 1, fanout: 2, labels })[0];
    const targets = [
      { list: roots, index: roots.length },
      ...all.map((slot) => ({ list: slot.list, index: slot.index })),
    ];
    const target = pick(targets);
    target.list.splice(target.index, 0, subtree);
    return { kind, size: size(subtree) };
  }
  if (kind === 'delete') {
    const slot = pick(all);
    const [removed] = slot.list.splice(slot.index, 1);
    return { kind, size: size(removed) };
  }
  // move: take a subtree out, put it somewhere that is not inside itself
  const slot = pick(all);
  const [subtree] = slot.list.splice(slot.index, 1);
  const targets: { list: TreeSpec[]; index: number }[] = [{ list: roots, index: roots.length }];
  const walk = (list: TreeSpec[]): void => {
    list.forEach((spec, index) => {
      targets.push({ list, index });
      if (!contains(spec, subtree)) walk(spec.children);
    });
  };
  walk(roots);
  const target = pick(targets);
  target.list.splice(target.index, 0, subtree);
  return { kind, size: size(subtree) };
}
