export interface Event {
  id: integer;
  definedClass: string;
  methodId: string;
  labels: string[];
  isFunction: bool;
  returnValue: any;
  callEvent: Event;
  returnEvent: Event;
  codeObject: CodeObject;
  isCall: function(): boolean;
  isReturn: function(): boolean;
}

export interface CodeObject {
  name: string;
  type: string;
  children: CodeObject[];
  location: string; // Functions only
  static: boolean; // Functions only
}

export interface CodeObjectMatcher {
  match: function(CodeObject) : string;
  pop: function() : void;
}

export interface CodeObjectMatch {
  appmap: string;
  codeObject: CodeObject;
}

export interface EventMatch {
  appmap
  event
  ancestors
  descendants
  caller
}

export interface FunctionSpec {
  tokens: Array<(codeObject: CodeObject) => boolean>;
}
