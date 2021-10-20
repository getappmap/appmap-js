import { Event } from '@appland/models';
import { Scope } from 'src/types';
import ScopeIterator from './scopeIterator';

class ScopeImpl implements Scope {
  scope: Event;
  private eventsIter: Generator<Event>;

  constructor(events: Generator<Event>) {
    this.eventsIter = events;
    this.scope = events.next().value;
  }

  *events(): Generator<Event> {
    if (this.scope) {
      yield this.scope;
    }

    for (const event of this.eventsIter) {
      if (event.isCall()) {
        yield event;
      }
    }
  }
}

export default class AppMapScope extends ScopeIterator {
  *scopes(events: Generator<Event>): Generator<Scope> {
    yield new ScopeImpl(events);
  }
}
