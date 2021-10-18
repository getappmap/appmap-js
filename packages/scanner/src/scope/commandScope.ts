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

export default class CommandScope extends ScopeIterator {
  *scopes(events: Generator<Event>): Generator<Scope> {
    for (const event of events) {
      if (event.isCall()) {
        if (
          event.codeObject.labels.has('command') ||
          event.codeObject.labels.has('job') ||
          event.httpServerRequest
        ) {
          yield new ScopeImpl(event);

          this.advanceToReturnEvent(event, events);
        }
      }
    }
  }
}
