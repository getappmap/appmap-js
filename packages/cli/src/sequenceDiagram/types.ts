export type Actor = {
  id: string;
  name: string;
  static: boolean;
  order: number;
};

export enum NodeType {
  Loop,
  Conditional,
  Request,
  WebRequest,
}

export type Action = Loop | Conditional | Request | WebRequest;

export type Node = {
  nodeType: NodeType;
  detailDigest: string;
  parent?: Action;
  children: Action[];
  descendantCount: number;
};

export type Loop = Node & {
  nodeType: NodeType.Loop;
  count: number;
};

export type Conditional = Node & {
  nodeType: NodeType.Conditional;
  nodeName: string;
  conditionName: string;
};

export type Type = {
  name: string;
  properties?: string[];
};

export type Message = Node & {};

export type Request = Message &
  Node & {
    nodeType: NodeType.Request;
    caller: Actor;
    callee: Actor;
    name: string;
    stableProperties: Record<string, string | number>;
    response?: Response;
    baseName?: string;
  };

export type WebRequest = Message &
  Node & {
    nodeType: NodeType.WebRequest;
    callee: Actor;
    route: string;
    status: number;
    baseMethod?: string;
    basePath?: string;
    baseStatus?: number;
  };

export type Response = {
  returnValueType?: Type;
  raisesException: boolean;
};

export const isLoop = (action: Action): action is Loop => action.nodeType === NodeType.Loop;

export const isRequest = (action: Action): action is Request =>
  action.nodeType === NodeType.Request;

export const isWebRequest = (action: Action): action is WebRequest =>
  action.nodeType === NodeType.WebRequest;

export const isConditional = (action: Action): action is Conditional =>
  action.nodeType === NodeType.Conditional;

export const actionActors = (action: Action): Actor[] => {
  if (isRequest(action)) return [action.caller, action.callee];

  if (isWebRequest(action)) return [action.callee];

  return [];
};

export function countDescendants(node: Action): void {
  node.children.forEach((child) => countDescendants(child));

  node.descendantCount = node.children.reduce((count, node) => count + node.descendantCount + 1, 0);
}

export type Diagram = {
  actors: Actor[];
  rootActions: Action[];
};
