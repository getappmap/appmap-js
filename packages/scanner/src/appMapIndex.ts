import { AppMap, normalizeSQL, parseSQL, Event } from '@appland/models';
import { QueryAST } from './types';
import LRUCache from 'lru-cache';
import sqlWarning from './sqlWarning';

const NormalizedSQLBySQLString = new LRUCache<string, string>({ max: 10000 });
const ASTBySQLString = new LRUCache<string, QueryAST>({ max: 1000 });

export default class AppMapIndex {
  constructor(public appMap: AppMap) {}

  sqlAST(event: Event): QueryAST | undefined {
    if (!event.sql) throw new Error(`${event.fqid} is not a SQL query`);

    const sql = this.sqlNormalized(event);
    let ast = ASTBySQLString.get(sql);
    if (!ast) {
      ast = parseSQL(sql, sqlWarning);
      ast ? ASTBySQLString.set(sql, ast) : ASTBySQLString.set(sql, [] as any);
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
