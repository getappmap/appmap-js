import { Event, EventNavigator } from '@appland/models';
import { Scope } from 'src/types';

export default class ScopeImpl implements Scope {
  scope: Event;
  descendants: EventNavigator;

  constructor(event: Event) {
    this.scope = event;
    this.descendants = new EventNavigator(event);
  }

  *events(): Generator<Event> {
    yield this.scope;

    for (const event of this.descendants.descendants()) {
      yield event.event;
    }
  }
}
