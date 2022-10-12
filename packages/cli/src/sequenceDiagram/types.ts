export type Actor = {
  id: string;
  name: string;
  static: boolean;
  order: number;
};

export enum NodeType {
  Loop,
  Request,
  WebRequest,
}

export type Action = Loop | Request | WebRequest;

export type Node = {
  nodeType: NodeType;
  detailDigest: string;
  children: Action[];
};

export type Loop = Node & {
  nodeType: NodeType.Loop;
  count: number;
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
  };

export type WebRequest = Message &
  Node & {
    nodeType: NodeType.WebRequest;
    callee: Actor;
    route: string;
    status: number;
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

export type Diagram = {
  appmapFile: string;
  actors: Actor[];
  rootActions: Action[];
};
