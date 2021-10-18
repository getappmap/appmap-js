import { Event } from '@appland/models';
import { Scope } from 'src/types';

export default abstract class ScopeIterator {
  abstract scopes(events: Generator<Event>): Generator<Scope>;
}
