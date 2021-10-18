import { Event } from '@appland/models';
import { Scope } from 'src/types';
import ScopeImpl from './scopeImpl';
import ScopeIterator from './scopeIterator';

export default class HTTPServerRequestScope extends ScopeIterator {
  *scopes(events: Generator<Event>): Generator<Scope> {
    for (const event of events) {
      if (event.isCall()) {
        if (event.httpServerRequest) {
          yield new ScopeImpl(event);

          this.advanceToReturnEvent(event, events);
        }
      }
    }
  }
}
