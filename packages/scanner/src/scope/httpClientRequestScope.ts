import { AppMapIndex, Scope } from 'src/types';
import ScopeImpl from './scopeImpl';
import ScopeIterator from './scopeIterator';

export default class HTTPClientRequestScope extends ScopeIterator {
  *scopes(appMapIndex: AppMapIndex): Generator<Scope> {
    for (const event of appMapIndex.forType('http_client_request')) {
      yield new ScopeImpl(event);
    }
  }
}
