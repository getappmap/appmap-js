export type Actor = {
  id: string;
  name: string;
  static: boolean;
  order: number;
};

export enum NodeType {
  Loop,
  Group,
  Request,
  Response,
}

export type Node = {
  nodeType: NodeType;
};

export type Loop = Node & {
  count: number;
};

export type Group = Node & {
  labels: string[];
};

export type Type = {
  name: string;
  properties?: string[];
};

export type Message = Node & {};

export type Request = Message & {
  nodeType: NodeType.Request;
  caller: Actor;
  callee: Actor;
  name: string;
  stableProperties: Record<string, string | number>;
  response?: Response;
};

export type Response = Message & {
  nodeType: NodeType.Response;
  request: Request;
  returnValueType?: Type;
  raisesException: boolean;
};

export const isLoop = (edge: Loop | Group | Request | Response): edge is Loop =>
  edge.nodeType === NodeType.Loop;

export const isGroup = (edge: Loop | Group | Request | Response): edge is Group =>
  edge.nodeType === NodeType.Group;

export const isRequest = (edge: Loop | Group | Request | Response): edge is Request =>
  edge.nodeType === NodeType.Request;

export const isResponse = (edge: Loop | Group | Request | Response): edge is Response =>
  edge.nodeType === NodeType.Response;

export type Diagram = {
  appmapFile: string;
  actors: Actor[];
  messages: (Loop | Group | Request | Response)[];
};
