import assert from 'assert';
import { AppMapIndex, Scope } from 'src/types';
import ScopeImpl from './scopeImpl';
import ScopeIterator from './scopeIterator';

export default class RootScope extends ScopeIterator {
  *scopes(appMapIndex: AppMapIndex): Generator<Scope> {
    const events = appMapIndex.appMap.events;
    for (let index = 0; index < events.length; index++) {
      const event = events[index];
      // TODO: Use pseudo-label @scope.root
      if (event.isCall() && !event.parent) {
        yield new ScopeImpl(event);

        index = event.returnEvent.id - 1;
        assert(events[index] === event.returnEvent);
      }
    }
  }
}
