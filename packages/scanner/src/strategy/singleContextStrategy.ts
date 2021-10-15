import { Event } from '@appland/models';
import { verbose } from '../scanner/util';
import { ScopedEvent } from '../types';
import Strategy from './strategy';

export default abstract class SingleContextStrategy extends Strategy {
  protected abstract isEventApplicable(event: Event): boolean;

  *selectEvents(events: Generator<Event>): Generator<ScopedEvent> {
    const scopeId = '1';
    let eventResult = events.next();
    while (!eventResult.done) {
      const event = eventResult.value;

      if (event.isCall()) {
        if (this.isEventApplicable(event)) {
          yield { event, scopeId };
        } else {
          if (verbose()) {
            console.warn(`${event.toString()} is not applicable. Skipping.`);
          }
        }
      }

      eventResult = events.next();
    }
  }
}
