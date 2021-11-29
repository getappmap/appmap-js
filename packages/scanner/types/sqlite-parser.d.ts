declare module 'sqlite-parser' {
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
    export type Statement = ListStatement | TransactionStatement;
  }
  export default function (sql: string): SqliteParser.ListStatement;
}
