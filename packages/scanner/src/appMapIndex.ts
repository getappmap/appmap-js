import { AppMap, sqlWarning, normalizeSQL, parseSQL, Event } from '@appland/models';
import { QueryAST } from './types';
import LRUCache from 'lru-cache';

const NormalizedSQLBySQLString = new LRUCache<string, string>({ max: 2000 });
const ASTBySQLString = new LRUCache<string, QueryAST>({ max: 2000 });

export default class AppMapIndex {
  constructor(public appMap: AppMap) {}

  sqlAST(event: Event): QueryAST | undefined {
    if (!event.sql) throw new Error(`${event.fqid} is not a SQL query`);

    const sql = this.sqlNormalized(event);
    let ast = ASTBySQLString.get(sql);
    if (!ast) {
      try {
        ast = parseSQL(sql);
      } catch {
        sqlWarning(`Unable to parse query: ${sql}`);
        ast = [] as any as QueryAST;
      }
      if (ast) {
        ASTBySQLString.set(sql, ast);
      }
    }
    return ast;
  }

  sqlNormalized(event: Event): string {
    if (!event.sql) throw new Error(`${event.fqid} is not a SQL query`);

    const cacheKey = [event.sql.database_type, event.sql.sql].join(':');
    let sql = NormalizedSQLBySQLString.get(cacheKey);
    if (!sql) {
      sql = normalizeSQL(event.sql.sql, event.sql.database_type);
      NormalizedSQLBySQLString.set(cacheKey, sql);
    }
    return sql;
  }
}
