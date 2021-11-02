import { Event } from '@appland/models';
import { Level, MatchResult } from '../types';
import Assertion from '../assertion';
import { SQLCount, sqlStrings } from '../database';

class Options {
  constructor(public warningLimit = 5, public errorLimit = 10, public whitelist: string[] = []) {}
}

function scanner(options: Options = new Options()): Assertion {
  const sqlCount: Record<string, SQLCount> = {};

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

export default { scope: 'command', enumerateScope: false, Options, scanner };
