import type { Event } from '@appland/models';
import type { SqliteParser } from '@appland/models/types/sqlite-parser';
import assert from 'assert';
import type AppMapIndex from '../../appMapIndex';
import type { SQLCount } from '../../database';
import { countJoins, sqlStrings } from '../../database';
import type { EventFilter, MatchResult, RuleLogic } from '../../types';
import { buildFilters } from '../lib/matchPattern';
import type Options from './options';

export interface JoinCount extends SQLCount {
  joins: number;
}

export default function rule(options: Options): RuleLogic {
  const excludeTables = buildFilters(options.excludeTables);

  function filterTable(table: SqliteParser.Node): boolean {
    assert(table.type === 'identifier');
    assert(table.variant === 'table');
    return !excludeTables.find((filter) => filter(table.name));
  }

  // TODO: clean up (https://github.com/getappmap/scanner/issues/43)
  function matcher(
    command: Event,
    appMapIndex: AppMapIndex,
    eventFilter: EventFilter
  ): MatchResult[] | undefined {
    const joinCount: Record<string, JoinCount> = {};
    for (const sqlEvent of sqlStrings(command, appMapIndex, eventFilter)) {
      let occurrence = joinCount[sqlEvent.sql];

      if (!occurrence) {
        const sqlAST = appMapIndex.sqlAST(sqlEvent.event);

        occurrence = {
          count: 1,
          joins: countJoins(sqlAST, filterTable),
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
          event: occurrence.events[0],
          message: `${occurrence.joins} join${occurrence.joins > 1 ? 's' : ''} in SQL "${sql}"`,
          relatedEvents: occurrence.events,
        });
      }
      return matchResults;
    }, [] as MatchResult[]);
  }

  return {
    matcher,
  };
}
