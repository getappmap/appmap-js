export namespace SqliteParser {
  export interface ListStatement {
    type: 'statement';
    variant: 'list';
    statement: Statement[];
  }
  export interface TransactionStatement {
    type: 'statement';
    variant: 'transaction';
    action: 'begin' | 'rollback' | 'commit';
  }
  export interface SelectStatement {
    type: 'statement';
    variant: 'select';
    result: Node[];
  }
  export interface Function {
    type: 'function';
    variant: 'call';
    name: Identifier;
  }
  export interface Identifier {
    type: 'identifier';
    variant: 'table';
    name: string;
  }
  export interface LimitExpression {
    type: 'expression';
    variant: 'limit';
  }
  export interface JoinExpression {
    type: 'map';
    variant: 'join';
    map?: Node[];
  }
  export type Statement = ListStatement | TransactionStatement | SelectStatement;
  export type Node = Statement | Function | Identifier | LimitExpression | JoinExpression;
}
export default function (sql: string): SqliteParser.ListStatement;
