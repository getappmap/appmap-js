import { Event, EventNavigator } from '@appland/models';
import { Scope } from '../types';
import ScopeIterator from './scopeIterator';

class ScopeImpl implements Scope {
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

const Command = 'command.perform';
const Job = 'job.perform';

export default class CommandScope extends ScopeIterator {
  *scopes(events: IterableIterator<Event>): Generator<Scope> {
    let found = false;
    const roots: Event[] = [];
    for (const event of events) {
      if (event.isCall() && !event.parent) {
        roots.push(event);
      }

      if (
        event.isCall() &&
        (event.codeObject.labels.has(Command) ||
          event.codeObject.labels.has(Job) ||
          event.httpServerRequest)
      ) {
        found = true;
        yield new ScopeImpl(event);

        this.advanceToReturnEvent(event, events);
      }
    }
    // If no true command is found, yield all root events.
    if (!found) {
      for (let index = 0; index < roots.length; index++) {
        const event = roots[index];
        yield new ScopeImpl(event);
      }
    }
  }
}
