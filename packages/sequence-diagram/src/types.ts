export interface CodeObject {
  name: string;
  type: string;
  fqid: string;
  children?: CodeObject[];
  parent?: CodeObject;
  location?: string; // Functions only
  static?: boolean; // Functions only
}

export type Actor = {
  id: string;
  name: string;
  order: number;
};

export enum NodeType {
  Loop = 1,
  Conditional,
  Function,
  ServerRPC,
  ClientRPC,
  Query,
}

export enum DiffMode {
  Insert = 1,
  Delete,
  Change,
}

export type Action = Loop | FunctionCall | ServerRPC | ClientRPC | Query;

export type ActionPredicate = (action: Action) => boolean;

export type Node = {
  nodeType: NodeType;
  digest: string;
  subtreeDigest: string;
  parent?: Action;
  children: Action[];
  diffMode?: DiffMode;
  elapsed?: number;
  formerName?: string;
  formerResult?: string;
};

export type Loop = Node & {
  nodeType: NodeType.Loop;
  count: number;
};

export type Type = {
  name: string;
  properties?: string[];
};

export type Message = Node;

export type FunctionCall = Message &
  Node & {
    nodeType: NodeType.Function;
    caller?: Actor;
    callee: Actor;
    name: string;
    static: boolean;
    stableProperties: Record<string, string | number>;
    returnValue?: ReturnValue;
  };

export type ServerRPC = Message &
  Node & {
    nodeType: NodeType.ServerRPC;
    callee: Actor;
    route: string;
    status: number;
  };

export type ClientRPC = Message &
  Node & {
    nodeType: NodeType.ClientRPC;
    caller: Actor;
    callee: Actor;
    route: string;
    status: number;
  };

export type Query = Message &
  Node & {
    nodeType: NodeType.Query;
    caller: Actor;
    callee: Actor;
    query: string;
  };

export type ReturnValue = {
  returnValueType?: Type;
  raisesException: boolean;
};

export const isLoop = (action: Action): action is Loop => action.nodeType === NodeType.Loop;

export const isFunction = (action: Action): action is FunctionCall =>
  action.nodeType === NodeType.Function;

export const isServerRPC = (action: Action): action is ServerRPC =>
  action.nodeType === NodeType.ServerRPC;

export const isClientRPC = (action: Action): action is ClientRPC =>
  action.nodeType === NodeType.ClientRPC;

export const isQuery = (action: Action): action is Query => action.nodeType === NodeType.Query;

export const actionActors = (action: Action | undefined): (Actor | undefined)[] => {
  if (!action) return [];

  if (isFunction(action) || isClientRPC(action) || isQuery(action))
    return [action.caller, action.callee];

  if (isServerRPC(action)) return [undefined, action.callee];

  return [];
};

export const nodeName = (action: Action | undefined): string => {
  if (!action) return 'undefined';

  switch (action.nodeType) {
    case NodeType.Function:
      return action.name;
    case NodeType.ServerRPC:
    case NodeType.ClientRPC:
      return action.route;
    case NodeType.Query:
      return action.query;
    case NodeType.Loop:
      return 'loop';
  }
};

export const nodeResult = (action: Action | undefined): string | undefined => {
  if (!action) return undefined;

  switch (action.nodeType) {
    case NodeType.Function:
      if (!action.returnValue) return;

      if (action.returnValue.returnValueType) return action.returnValue.returnValueType.name;

      if (action.returnValue.raisesException) return 'exception!';
      break;
    case NodeType.ServerRPC:
      return action.status.toString();
    case NodeType.ClientRPC:
      return action.status.toString();
  }
};

export function parseRoute(route: string): { method: string; path?: string } {
  const tokens = route.split(/\s+/);
  return {
    method: tokens[0],
    path: tokens.slice(1).join(' '),
  };
}

export function setParent(action: Action, parent?: Action): void {
  if (parent) action.parent = parent;

  action.children.forEach((child) => setParent(child, action));
}

export function findAncestor(action: Action, test: ActionPredicate): Action | undefined {
  let parent = action.parent;
  while (parent) {
    if (test(parent)) return parent;
    parent = parent.parent;
  }
}

export function hasAncestor(action: Action, test: ActionPredicate): boolean {
  return findAncestor(action, test) !== undefined;
}

export interface Diagram {
  actors: Actor[];
  rootActions: Action[];
}

import buildDiagram from './buildDiagram';
import buildDiffDiagram from './buildDiffDiagram';
import diff from './diff';

export { buildDiagram, buildDiffDiagram, diff };

export enum FormatType {
  JSON = 'json',
  PlantUML = 'plantuml',
}

export const Formatters = [FormatType.JSON, FormatType.PlantUML];

import format from './formatter';
export { format };

import type { SequenceDiagramOptions } from './specification';
import { default as Specification } from './specification';

import { DiffOptions, Diff, Move, MoveType, Position } from './diff';

export { SequenceDiagramOptions, Specification, DiffOptions, Diff, Move, MoveType, Position };
