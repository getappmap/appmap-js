import { Event } from '@appland/models';
import { Scope } from '../types';

export default abstract class ScopeIterator {
  abstract scopes(events: Iterable<Event>): Generator<Scope>;

  // Scan ahead past the return event of the yielded scope.
  protected advanceToReturnEvent(scopeEvent: Event, events: Iterator<Event>): void {
    // Don't use for...of events here, it doesn't work with an outer for...of on the same events generator.
    let eventResult = events.next();
    while (!eventResult.done) {
      const event = eventResult.value;
      if (event.isReturn() && event.callEvent === scopeEvent) {
        break;
      }
      eventResult = events.next();
    }
  }
}
