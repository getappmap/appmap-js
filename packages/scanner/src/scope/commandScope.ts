import { Event, EventNavigator } from '@appland/models';
import { Scope } from 'src/types';
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
  *scopes(events: IterableIterator<Event>): Generator<Scope> {
    for (const event of events) {
      if (
        event.isCall() &&
        (event.codeObject.labels.has(Command) ||
          event.codeObject.labels.has(Job) ||
          event.httpServerRequest)
      ) {
        yield new ScopeImpl(event);

        this.advanceToReturnEvent(event, events);
      }
    }
  }
}
