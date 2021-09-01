import Assertion from './assertion';
import Strategy from './strategy/strategy';
import HttpRequestStrategy from './strategy/httpRequestStrategy';
import AbortError from '../error/abortError';
import { AppMapData } from '../../appland/types';
import SqlQueryStrategy from './strategy/sqlQueryStrategy';
import { AssertionFailure } from './types';

export default class AssertionChecker {
  private strategies: Strategy[] = [
    new HttpRequestStrategy(),
    new SqlQueryStrategy(),
  ];

  check(
    appMapData: AppMapData,
    assertion: Assertion,
    failures: AssertionFailure[]
  ): void {
    for (let strategy of this.strategies) {
      if (strategy.supports(assertion)) {
        return strategy.check(appMapData, assertion, failures);
      }
    }

    throw new AbortError(`Strategy not found for scope "${assertion.scope}".`);
  }
}
