import { Event, EventNavigator } from '@appland/models';
import assert from 'assert';
import { AppMapIndex, Scope } from 'src/types';
import ScopeIterator from './scopeIterator';

class ScopeImpl implements Scope {
  scope: Event;
  descendants: EventNavigator;

  constructor(event: Event) {
    this.scope = event;
    this.descendants = new EventNavigator(event);
  }

  *events(): Generator<Event> {
    yield this.scope;

    for (const event of this.descendants.descendants()) {
      yield event.event;
    }
  }
}

// TODO: Document the usage of these labels.
const Command = 'command';
const Job = 'job';

export default class CommandScope extends ScopeIterator {
  *scopes(appMapIndex: AppMapIndex): Generator<Scope> {
    const events = appMapIndex.appMap.events;
    for (let index = 0; index < events.length; index++) {
      const event = events[index];
      // TODO: Use pseudo-label @scope.command
      if (
        event.isCall() &&
        (event.codeObject.labels.has(Command) ||
          event.codeObject.labels.has(Job) ||
          event.httpServerRequest)
      ) {
        yield new ScopeImpl(event);

        index = event.returnEvent.id - 1;
        assert(events[index] === event.returnEvent);
      }
    }
  }
}
