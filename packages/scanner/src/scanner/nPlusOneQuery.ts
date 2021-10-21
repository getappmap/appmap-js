import { Event, EventNavigator, getSqlLabelFromString, SqlQuery } from '@appland/models';
import { AssertionSpec, Level, MatchResult } from '../types';
import Assertion from '../assertion';
import { obfuscate } from '../database';

function sqlNormalized(query: SqlQuery): string {
  return obfuscate(query.sql, query.database_type);
}

interface SQLEvent {
  sql: string;
  event: Event;
}

interface SQLCount {
  count: number;
  events: Event[];
}

class Options {
  constructor(public warningLimit = 5, public errorLimit = 10, public whitelist: string[] = []) {}
}

function scanner(options: Options = new Options()): Assertion {
  const sqlCount: Record<string, SQLCount> = {};

  const sqlStrings = function* (event: Event): Generator<SQLEvent> {
    for (const e of new EventNavigator(event).descendants()) {
      if (!e.event.sqlQuery) {
        continue;
      }
      if (getSqlLabelFromString(e.event.sqlQuery!) !== 'SQL Select') {
        continue;
      }

      const sql = sqlNormalized(e.event.sql!);
      if (options.whitelist.includes(sql)) {
        continue;
      }

      yield { event: e.event, sql };
    }
  };

  const matcher = (command: Event): MatchResult[] | undefined => {
    for (const sqlEvent of sqlStrings(command)) {
      let occurrance = sqlCount[sqlEvent.sql];
      if (!occurrance) {
        occurrance = {
          count: 1,
          events: [sqlEvent.event],
        };
        sqlCount[sqlEvent.sql] = occurrance;
      } else {
        occurrance.count += 1;
        occurrance.events.push(sqlEvent.event);
      }
    }

    return Object.keys(sqlCount).reduce((matchResults, sql) => {
      const occurrance = sqlCount[sql];

      const buildMatchResult = (level: Level): MatchResult => {
        return {
          level: level,
          event: occurrance.events[0],
          message: `${occurrance.count} occurrances of SQL "${sql}"`,
          relatedEvents: occurrance.events,
        };
      };

      if (occurrance.count >= options.errorLimit) {
        matchResults.push(buildMatchResult('error'));
      } else if (occurrance.count >= options.warningLimit) {
        matchResults.push(buildMatchResult('warning'));
      }
      return matchResults;
    }, [] as MatchResult[]);
  };

  return Assertion.assert(
    'n-plus-one-query',
    'N+1 SQL queries',
    matcher,
    (assertion: Assertion): void => {
      assertion.description = `SQL query should not be repeated within the same command`;
    }
  );
}

export default { scope: 'command', enumerateScope: false, Options, scanner } as AssertionSpec;
