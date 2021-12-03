import { Event, EventNavigator } from '@appland/models';
import { AssertionSpec, MatchResult } from 'src/types';
import * as types from './types';
import Assertion from '../assertion';

// TODO: Use the Query AST for this.
const QueryIncludes: RegExp[] = [/\bINSERT\b/i, /\bUPDATE\b/i];
const UpdateMethods: string[] = ['put', 'post', 'patch'];

class Options implements types.TooManyUpdates.Options {
  public warningLimit = 20;
}

function scanner(options: Options): Assertion {
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

  const matcher = (command: Event): MatchResult[] | undefined => {
    const events: Event[] = [];
    for (const updateEvent of updateEvents(command)) {
      events.push(updateEvent);
    }

    if (events.length > options.warningLimit) {
      return [
        {
          level: 'error',
          message: `Command performs ${events.length} SQL and RPC updates`,
          event: events[0],
          relatedEvents: events,
        },
      ];
    }
  };

  return Assertion.assert(
    'too-many-updates',
    'Too many SQL and RPC updates performed in one command',
    matcher,
    (assertion: Assertion): void => {
      assertion.description = `Too many SQL and RPC updates performed in one transaction`;
    }
  );
}

export default { scope: 'command', enumerateScope: false, Options, scanner } as AssertionSpec;
