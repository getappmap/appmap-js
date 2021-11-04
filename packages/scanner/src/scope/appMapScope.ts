import { Event } from '@appland/models';
import { Scope } from 'src/types';
import ScopeIterator from './scopeIterator';

class ScopeImpl implements Scope {
  scope: Event;
  private eventsGen: Generator<Event>;

  constructor(scope: Event, events: Generator<Event>) {
    this.scope = scope;
    this.eventsGen = events;
  }

  *events(): Generator<Event> {
    yield this.scope;

    for (const event of this.eventsGen) {
      if (event.isCall()) {
        yield event;
      }
    }
  }
}

export default class AppMapScope extends ScopeIterator {
  *scopes(events: Generator<Event>): Generator<Scope> {
    const eventsIter = events.next();
    if (eventsIter.done) {
      return;
    }
    yield new ScopeImpl(eventsIter.value, events);
  }
}
