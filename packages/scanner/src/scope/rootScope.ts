import { Event } from '@appland/models';
import { Scope } from 'src/types';
import ScopeImpl from './scopeImpl';
import ScopeIterator from './scopeIterator';

export default class RootScope extends ScopeIterator {
  *scopes(events: IterableIterator<Event>): Generator<Scope> {
    for (const event of events) {
      if (event.isCall() && !event.parent) {
        yield new ScopeImpl(event);

        this.advanceToReturnEvent(event, events);
      }
    }
  }
}
