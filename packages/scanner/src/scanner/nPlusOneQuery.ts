import { Event, getSqlLabelFromString, SqlQuery } from '@appland/models';
import { Level, MatchResult } from '../types';
import Assertion from '../assertion';
import { obfuscate } from '../database';

function sqlNormalized(query: SqlQuery): string {
  return obfuscate(query.sql, query.database_type);
}

class Options {
  constructor(public warningLimit = 5, public errorLimit = 10, public whitelist: string[] = []) {}
}

function scanner(options: Options = new Options()): Assertion {
  const sqlCount: Record<string, number> = {};
  const warnings = new Set<string>();
  const errors = new Set<string>();

  const matcher = (event: Event): MatchResult[] | undefined => {
    const sql = sqlNormalized(event.sql!);

    let count = sqlCount[sql];
    if (!count) {
      count = 1;
    } else {
      count = count + 1;
    }
    sqlCount[sql] = count;

    let level: Level | undefined;
    // TODO: Keep counting and report the max. This can't be done efficiently with the current Assertion interface.
    if (count === options.errorLimit) {
      if (!errors.has(sql)) {
        level = 'error';
        errors.add(sql);
      }
    } else if (count === options.warningLimit) {
      if (!warnings.has(sql)) {
        level = 'warning';
        warnings.add(sql);
      }
    }
    if (level) {
      return [
        {
          level: level,
          message: `${count} occurrances of SQL "${event.sqlQuery}"`,
        },
      ];
    }
  };

  // TODO: Ensure that the duplicate queries happen within a single command context.
  return Assertion.assert(
    'n-plus-one-query',
    'N+1 SQL queries',
    matcher,
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => {
        if (!e.sqlQuery) {
          return false;
        }

        if (getSqlLabelFromString(e.sqlQuery!) !== 'SQL Select') {
          return false;
        }

        const sql = sqlNormalized(e.sql!);
        if (options.whitelist.includes(sql)) {
          return false;
        }

        return true;
      };
      assertion.description = `SQL query should not be repeated within the same command`;
    }
  );
}

export default { scope: 'command', enumerateScope: false, Options, scanner };
