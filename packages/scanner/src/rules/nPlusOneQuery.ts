import { AppMap, Event } from '@appland/models';
import { EventFilter, Level, MatchResult, Rule, RuleLogic } from '../types';
import * as types from './types';
import { SQLCount, sqlStrings } from '../database';

class Options implements types.NPlusOneQuery.Options {
  public warningLimit = 5;
  public errorLimit = 10;
}

// TODO: clean up according to https://github.com/applandinc/scanner/issues/43
function build(options: Options): RuleLogic {
  const sqlCount: Record<string, SQLCount> = {};

  function matcher(
    command: Event,
    _appMap: AppMap,
    eventFilter: EventFilter
  ): MatchResult[] | undefined {
    for (const sqlEvent of sqlStrings(command, eventFilter)) {
      let occurrence = sqlCount[sqlEvent.sql];
      if (!occurrence) {
        occurrence = {
          count: 1,
          events: [sqlEvent.event],
        };
        sqlCount[sqlEvent.sql] = occurrence;
      } else {
        occurrence.count += 1;
        occurrence.events.push(sqlEvent.event);
      }
    }

    return Object.keys(sqlCount).reduce((matchResults, sql) => {
      const occurrence = sqlCount[sql];

      const buildMatchResult = (level: Level): MatchResult => {
        return {
          level: level,
          event: occurrence.events[0],
          message: `${occurrence.count} occurrences of SQL: ${sql}`,
          groupMessage: sql,
          occurranceCount: occurrence.count,
          relatedEvents: occurrence.events,
        };
      };

      if (occurrence.count >= options.errorLimit) {
        matchResults.push(buildMatchResult('error'));
      } else if (occurrence.count >= options.warningLimit) {
        matchResults.push(buildMatchResult('warning'));
      }
      return matchResults;
    }, [] as MatchResult[]);
  }

  return {
    matcher,
  };
}

export default {
  id: 'n-plus-one-query',
  title: 'N plus 1 SQL query',
  scope: 'command',
  enumerateScope: false,
  Options,
  build,
} as Rule;
