import { Event, EventNavigator } from '@appland/models';
import { MatchResult, Rule, RuleLogic } from 'src/types';
import { URL } from 'url';
import * as types from './types';
import parseRuleDescription from './lib/parseRuleDescription';

// TODO: Use the Query AST for this.
const QueryIncludes: RegExp[] = [/\bINSERT\b/i, /\bUPDATE\b/i];
const UpdateMethods: string[] = ['put', 'post', 'patch'];

class Options implements types.TooManyUpdates.Options {
  public warningLimit = 20;
}

function build(options: Options): RuleLogic {
  const isUpdate = (event: Event): boolean => {
    const isSQLUpdate = (): boolean => {
      if (!event.sqlQuery) {
        return false;
      }
      return QueryIncludes.some((pattern) => pattern.test(event.sqlQuery!));
    };

    const isRPCUpdate = (): boolean => {
      if (!event.httpClientRequest) {
        return false;
      }
      return UpdateMethods.includes(event.httpClientRequest!.request_method.toLowerCase());
    };

    return isSQLUpdate() || isRPCUpdate();
  };

  const updateEvents = function* (event: Event): Generator<Event> {
    for (const e of new EventNavigator(event).descendants()) {
      if (!isUpdate(e.event)) {
        continue;
      }
      yield e.event;
    }
  };

  function matcher(command: Event): MatchResult[] | undefined {
    const events: Event[] = [];
    for (const updateEvent of updateEvents(command)) {
      events.push(updateEvent);
    }

    if (events.length > options.warningLimit) {
      return [
        {
          message: `Command performs ${events.length} SQL and RPC updates`,
          event: events[0],
          relatedEvents: events,
        },
      ];
    }
  }

  return {
    matcher,
  };
}

export default {
  id: 'too-many-updates',
  title: 'Too many SQL and RPC updates performed in one command',
  scope: 'command',
  enumerateScope: false,
  impactDomain: 'Maintainability',
  references: {
    'CWE-1048': new URL('https://cwe.mitre.org/data/definitions/1048.html'),
  },
  description: parseRuleDescription('tooManyUpdates'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#too-many-updates',
  Options,
  build,
} as Rule;
