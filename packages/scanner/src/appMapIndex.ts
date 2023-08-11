import { AppMap, normalizeSQL, parseSQL, Event } from '@appland/models';
import { QueryAST } from './types';
import LRUCache from 'lru-cache';

const NormalizedSQLBySQLString = new LRUCache<string, string>({ max: 10000 });
const ASTBySQLString = new LRUCache<string, QueryAST | 'parse-error'>({ max: 1000 });

export default class AppMapIndex {
  constructor(public appMap: AppMap) {}

  sqlAST(event: Event): QueryAST | undefined {
    if (!event.sql) throw new Error(`${event.fqid} is not a SQL query`);

    const sql = this.sqlNormalized(event);
    let result: QueryAST | undefined;
    const cachedAST = ASTBySQLString.get(sql);
    if (cachedAST === 'parse-error') {
      result = undefined;
    } else if (cachedAST) {
      result = cachedAST;
    } else {
      result = parseSQL(sql);
      ASTBySQLString.set(sql, result ? result : 'parse-error');
    }
    return result;
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
