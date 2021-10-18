import { Event } from '@appland/models';
import { Scope } from 'src/types';
import ScopeImpl from './scopeImpl';
import ScopeIterator from './scopeIterator';

export default class RootScope extends ScopeIterator {
  *scopes(events: Generator<Event>): Generator<Scope> {
    for (const event of events) {
      if (event.isCall()) {
        if (!event.parent) {
          yield new ScopeImpl(event);
        }
      }
    }
  }
}
