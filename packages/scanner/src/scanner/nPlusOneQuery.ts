import { AppMap, Event, EventNavigator, getSqlLabelFromString, SqlQuery } from '@appland/models';
import Assertion from '../assertion';
import { obfuscate } from '../database';

function findRootEvent(event: Event): Event {
  let evt = event;
  let parent = event.parent;
  while (parent) {
    evt = parent;
    parent = evt.parent;
  }
  return evt;
}

function sqlNormalized(query: SqlQuery): string {
  return obfuscate(query.sql, query.database_type);
}

class Limits {
  constructor(public warning: number = 3, public error: number = 10) {}
}

class Options {
  limit: Limits = new Limits();
  whitelist: string[] = [];
}

export default function (options: Options = new Options()): Assertion {
  const uniqueSQL = new Set<string>();
  const eventIdForRoot: Record<number, number> = {};

  const findDuplicates = (event: Event): number => {
    const sql = sqlNormalized(event.sql!);
    const eventRoot = findRootEvent(event);
    let matches = 0;
    const iter = new EventNavigator(eventRoot).descendants();
    let curr = iter.next();

    function isMatch(descendant: Event): boolean {
      if (descendant.id <= event.id) {
        return false;
      }
      if (!descendant.sql) {
        return false;
      }
      return sqlNormalized(descendant.sql!) === sql;
    }

    while (!curr.done) {
      if (isMatch(curr.value.event)) {
        matches += 1;
      }
      curr = iter.next();
    }
    return matches;
  };

  return Assertion.assert(
    'sql_query',
    (event: Event) => findDuplicates(event) < options.limit.warning,
    (assertion: Assertion): void => {
      assertion.where = (e: Event, appMap: AppMap) => {
        if (getSqlLabelFromString(e.sqlQuery!) !== 'SQL Select') {
          return false;
        }

        const rootEvent: Event = findRootEvent(e);
        const sql = sqlNormalized(e.sql!);
        if (options.whitelist.includes(sql)) {
          return false;
        }

        const sqlKey = [appMap.name, rootEvent.id, sql].join('\n');
        if (uniqueSQL.has(sqlKey)) {
          return false;
        }

        uniqueSQL.add(sqlKey);
        eventIdForRoot[rootEvent.id] = e.id;
        return true;
      };
      assertion.description = `SQL query should not be repeated within the same command`;
    }
  );
}
