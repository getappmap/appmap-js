import { Event } from '@appland/models';
import Scope from './scope';

export default class RootScope extends Scope {
  *scopes(events: Generator<Event>): Generator<Event> {
    let eventResult = events.next();
    while (!eventResult.done) {
      const event = eventResult.value;
      if (!event.parent) {
        yield event;
      }
      eventResult = events.next();
    }
  }
}
