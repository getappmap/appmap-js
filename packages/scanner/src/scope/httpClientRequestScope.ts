import { Event } from '@appland/models';
import { Scope } from 'src/types';
import ScopeImpl from './scopeImpl';
import ScopeIterator from './scopeIterator';

export default class HTTPClientRequestScope extends ScopeIterator {
  *scopes(events: Generator<Event>): Generator<Scope> {
    for (const event of events) {
      if (event.isCall() && event.httpClientRequest) {
        yield new ScopeImpl(event);

        this.advanceToReturnEvent(event, events);
      }
    }
  }
}
