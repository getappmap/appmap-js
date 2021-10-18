import { Event } from '@appland/models';

export default abstract class Scope {
  protected abstract scopes(events: Generator<Event>): Generator<Event>;
}
