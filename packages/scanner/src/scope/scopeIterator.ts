import { Event } from '@appland/models';
import { Scope } from 'src/types';

export default abstract class ScopeIterator {
  abstract scopes(events: Generator<Event>): Generator<Scope>;

  // Scan ahead past the return event.
  protected advanceToReturnEvent(event: Event, events: Generator<Event>): void {
    let eventResult = events.next();
    while (!eventResult.done) {
      if (eventResult.value.isReturn() && eventResult.value.parent?.id === event.id) {
        break;
      }
      eventResult = events.next();
    }
  }
}
