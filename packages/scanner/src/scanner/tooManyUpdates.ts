import { Event, EventNavigator } from '@appland/models';
import { AssertionSpec, MatchResult } from 'src/types';
import Assertion from '../assertion';

class Options {
  constructor(
    public maxUpdates: number = 20,
    public queryIncludes: string[] = ['\\binsert\\b', '\\bupdate\\b'],
    public updateMethods: string[] = ['put', 'post', 'patch']
  ) {}
}

function scanner(options: Options = new Options()): Assertion {
  const sqlPatterns = options.queryIncludes.map((pattern) => new RegExp(pattern, 'i'));

  const isUpdate = (event: Event): boolean => {
    const isSQLUpdate = (): boolean => {
      if (!event.sqlQuery) {
        return false;
      }
      return sqlPatterns.some((pattern) => pattern.test(event.sqlQuery!));
    };

    const isRPCUpdate = (): boolean => {
      if (!event.httpClientRequest) {
        return false;
      }
      return options.updateMethods.includes(event.httpClientRequest!.request_method.toLowerCase());
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

    if (events.length > options.maxUpdates) {
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

export default { enumerateScope: false, Options, scanner } as AssertionSpec;
