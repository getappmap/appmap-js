import { AppMap, buildQueryAST, Event } from '@appland/models';
import { sqlNormalized } from './database';
import { EventType, QueryAST } from './types';

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

const ASTBySQLString: Record<string, QueryAST> = {};

export default class AppMapIndex {
  eventsByLabel: Record<string, Event[]> = {};
  eventsByType: Record<string, Event[]> = {};
  sqlNormalizedByEventId: Record<number, string> = {};

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

  sqlAST(event: Event): QueryAST {
    if (!event.sql) throw new Error(`${event.fqid} is not a SQL query`);

    const sql = this.sqlNormalized(event);
    let ast = ASTBySQLString[sql];
    if (!ast) {
      try {
        ast = buildQueryAST(sql);
      } catch {
        console.warn(`Unable to parse query: ${sql}`);
        ast = [] as any as QueryAST;
      }
      ASTBySQLString[sql] = ast;
    }
    return ast;
  }

  sqlNormalized(event: Event): string {
    if (!event.sql) throw new Error(`${event.fqid} is not a SQL query`);

    let sql = this.sqlNormalizedByEventId[event.id];
    if (!sql) {
      sql = sqlNormalized(event.sql);
      this.sqlNormalizedByEventId[event.id] = sql;
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
