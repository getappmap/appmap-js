import { AppMap, Event } from '@appland/models';
import { AssertionSpec, MatchResult } from '../types';
import * as types from './types';
import Assertion from '../assertion';
import { countJoins, SQLCount, sqlStrings } from '../database';

export interface JoinCount extends SQLCount {
  joins: number;
}

class Options implements types.TooManyJoins.Options {
  public warningLimit = 5;
}

// TODO: clean up (https://github.com/applandinc/scanner/issues/43)
function scanner(options: Options = new Options()): Assertion {
  const joinCount: Record<string, JoinCount> = {};
  const matcher = (
    command: Event,
    _appMap: AppMap,
    assertion: Assertion
  ): MatchResult[] | undefined => {
    for (const sqlEvent of sqlStrings(command, assertion.filterEvent.bind(assertion))) {
      let occurrence = joinCount[sqlEvent.sql];

      if (!occurrence) {
        occurrence = {
          count: 1,
          joins: countJoins(sqlEvent.sql),
          events: [sqlEvent.event],
        };
        joinCount[sqlEvent.sql] = occurrence;
      } else {
        occurrence.count += 1;
        occurrence.events.push(sqlEvent.event);
      }
    }

    return Object.keys(joinCount).reduce((matchResults, sql) => {
      const occurrence = joinCount[sql];

      if (occurrence.joins >= options.warningLimit) {
        matchResults.push({
          level: 'warning',
          event: occurrence.events[0],
          message: `${occurrence.joins} join${occurrence.joins > 1 ? 's' : ''} in SQL "${sql}"`,
          relatedEvents: occurrence.events,
        });
      }
      return matchResults;
    }, [] as MatchResult[]);
  };

  return Assertion.assert(
    'too-many-joins',
    'Too many joins',
    matcher,
    (assertion: Assertion): void => {
      assertion.description = `SQL query has too many joins ${assertion.options}`;
    }
  );
}

export default { scope: 'command', enumerateScope: false, Options, scanner } as AssertionSpec;
