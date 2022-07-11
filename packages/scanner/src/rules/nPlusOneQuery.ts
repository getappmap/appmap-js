import { Event } from '@appland/models';
import { AppMapIndex, EventFilter, Level, MatchResult, Rule, RuleLogic } from '../types';
import * as types from './types';
import { SQLEvent, sqlStrings } from '../database';
import { URL } from 'url';
import parseRuleDescription from './lib/parseRuleDescription';

class Options implements types.NPlusOneQuery.Options {
  public warningLimit = 5;
  public errorLimit = 10;
}

function build(options: Options): RuleLogic {
  function matcher(
    command: Event,
    appMapIndex: AppMapIndex,
    eventFilter: EventFilter
  ): MatchResult[] | undefined {
    const sqlEvents = sqlStrings(command, appMapIndex, eventFilter);

    let sqlRollup: Record<string, SQLEvent[]> = {};
    const eventsById: Record<string, Event> = {};
    appMapIndex.appMap.events.forEach((event) => {
      eventsById[event.id] = event;
    });

    for (const sqlEvent of sqlEvents) {
      if (!sqlEvent.event.parent) continue;

      const key = [sqlEvent.event.parent.id, sqlEvent.sql].join('\n');
      sqlRollup[key] ||= [];
      sqlRollup[key].push(sqlEvent);
    }

    const matchResults: MatchResult[] = [];
    do {
      [...Object.keys(sqlRollup)].forEach((key) => {
        const events = sqlRollup[key];
        const [ancestorId, sql] = key.split('\n');
        const ancestor = eventsById[parseInt(ancestorId)]!;
        const occurranceCount = events.length;
        if (occurranceCount > options.warningLimit) {
          const buildMatchResult = (level: Level): MatchResult => {
            return {
              level: level,
              event: events[0].event,
              message: `${ancestor.toString()}[${
                ancestor.id
              }] contains ${occurranceCount} occurrences of SQL: ${sql}`,
              groupMessage: sql,
              occurranceCount: occurranceCount,
              relatedEvents: events.map((e) => e.event),
              participatingEvents: { commonAncestor: ancestor },
            };
          };

          if (occurranceCount >= options.errorLimit) {
            matchResults.push(buildMatchResult('error'));
          } else if (occurranceCount >= options.warningLimit) {
            matchResults.push(buildMatchResult('warning'));
          }
        }
      });

      const newRollup: Record<string, SQLEvent[]> = {};
      Object.keys(sqlRollup).forEach((key) => {
        const events = sqlRollup[key];
        if (events.length >= options.warningLimit) return;

        const [ancestorId, sql] = key.split('\n');
        const ancestor = eventsById[parseInt(ancestorId)]!;
        if (ancestor.parent) {
          const parentKey = [ancestor.parent.id, sql].join('\n');
          newRollup[parentKey] = (newRollup[parentKey] || []).concat(events);
        }
      }, {} as Record<string, SQLEvent[]>);
      sqlRollup = newRollup;
    } while (Object.keys(sqlRollup).length > 0);

    return matchResults;
  }

  return {
    matcher,
  };
}

export default {
  id: 'n-plus-one-query',
  title: 'N plus 1 SQL query',
  scope: 'command',
  impactDomain: 'Performance',
  enumerateScope: false,
  Options,
  references: {
    'CWE-1073': new URL('https://cwe.mitre.org/data/definitions/1073.html'),
  },
  description: parseRuleDescription('nPlusOneQuery'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#n-plus-one-query',
  build,
} as Rule;
