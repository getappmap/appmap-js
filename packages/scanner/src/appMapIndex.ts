import { AppMap, sqlWarning, buildQueryAST, Event } from '@appland/models';
import { sqlNormalized } from './database';
import { EventType, QueryAST } from './types';
import LRUCache from 'lru-cache';

function isDescendantOf(event: Event, rootEvent: Event): boolean {
  return !!event.ancestors().find((ancestor) => ancestor === rootEvent);
}

function filterEvents(events: Event[], rootEvent: Event | undefined): Event[] {
  if (rootEvent) {
    return events.filter((event) => isDescendantOf(event, rootEvent));
  }

  return events;
}

const SpecializedTypes = ['sql_query', 'http_client_request', 'http_server_request'];
const NormalizedSQLBySQLString = new LRUCache<string, string>({ max: 2000 });
const ASTBySQLString = new LRUCache<string, QueryAST>({ max: 2000 });

export default class AppMapIndex {
  eventsByLabel: Record<string, Event[]> = {};
  eventsByType: Record<string, Event[]> = {};

  constructor(public appMap: AppMap) {
    const events = appMap.events;
    for (let index = 0; index < events.length; index++) {
      const event = events[index];
      if (!event.isCall()) continue;

      {
        const type = SpecializedTypes.find((type) => (event as any)[type]) || 'function';
        let events = this.eventsByType[type];
        if (!events) {
          events = [];
          this.eventsByType[type] = events;
        }
        events.push(event);
      }

      {
        event.labels.forEach((label) => {
          let events = this.eventsByLabel[label];
          if (!events) {
            events = [];
            this.eventsByLabel[label] = events;
          }
          events.push(event);
        });
      }
    }
  }

  sqlAST(event: Event): QueryAST | undefined {
    if (!event.sql) throw new Error(`${event.fqid} is not a SQL query`);

    const sql = this.sqlNormalized(event);
    let ast = ASTBySQLString.get(sql);
    if (!ast) {
      try {
        ast = buildQueryAST(sql);
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
      sql = sqlNormalized(event.sql);
      NormalizedSQLBySQLString.set(cacheKey, sql);
    }
    return sql;
  }

  forType(type: EventType, rootEvent?: Event): Event[] {
    return filterEvents(this.eventsByType[type] || [], rootEvent);
  }

  forLabel(label: string, rootEvent?: Event): Event[] {
    return filterEvents(this.eventsByLabel[label] || [], rootEvent);
  }
}
