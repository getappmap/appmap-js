import { Event } from '@appland/models';

export enum EdgeType {
  Call,
  Return,
}

export const edgeString = (edge: BasicEdge): string => {
  return [
    edge.caller.codeObject.fqid.slice(0, 40),
    edge.callee.codeObject.fqid.slice(0, 40),
  ].join(' -> ');
};

export type BasicEdge = {
  type: EdgeType;
  caller: Event;
  callee: Event;
  message?: string;
  messageType?: string;
};

export type CallEdge = BasicEdge & {
  type: EdgeType.Call;
  hasResponse?: boolean;
};

export type ReturnEdge = BasicEdge & {
  type: EdgeType.Return;
  callEdge: CallEdge;
  exceptions: string[];
};

export type GraphEdge = CallEdge | ReturnEdge;

export const isCallEdge = (edge: GraphEdge): edge is CallEdge =>
  edge.type === EdgeType.Call;

export const isReturnEdge = (edge: GraphEdge): edge is ReturnEdge =>
  edge.type === EdgeType.Return;
