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
    yield this.scope;

    for (const event of this.eventsIter) {
      yield event;
    }
  }
}

export default class AllScope extends ScopeIterator {
  *scopes(events: Generator<Event>): Generator<Scope> {
    yield new ScopeImpl(events);
  }
}
