import { AppMap } from '@appland/models';
import Assertion from './assertion';
import { AbortError } from './errors';
import { AssertionFailure } from './types';
import Strategy from './strategy/strategy';
import HttpServerRequestStrategy from './strategy/httpServerRequestStrategy';
import SqlQueryStrategy from './strategy/sqlQueryStrategy';
import EventStrategy from './strategy/eventStrategy';
import FunctionStrategy from './strategy/functionStrategy';
import HttpClientRequestStrategy from './strategy/httpClientRequestStrategy';

export default class AssertionChecker {
  private strategies: Strategy[] = [
    new EventStrategy(),
    new FunctionStrategy(),
    new HttpClientRequestStrategy(),
    new HttpServerRequestStrategy(),
    new SqlQueryStrategy(),
  ];

  check(appMapData: AppMap, assertion: Assertion, failures: AssertionFailure[]): void {
    for (const strategy of this.strategies) {
      if (strategy.supports(assertion)) {
        return strategy.check(appMapData, assertion, failures);
      }
    }

    throw new AbortError(`Strategy not found for scope "${assertion.scope}".`);
  }
}
