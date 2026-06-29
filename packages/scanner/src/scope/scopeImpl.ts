import type { Event } from '@appland/models';
import { EventNavigator } from '@appland/models';
import type { Scope } from '../types';

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
