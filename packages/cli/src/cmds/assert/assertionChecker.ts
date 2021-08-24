import Assertion from './assertion';
import Strategy from './strategy/strategy';
import HttpRequestStrategy from './strategy/httpRequestStrategy';
import AbortError from '../error/abortError';
import { AppMapData } from '../../appland/types';

export default class AssertionChecker {
  private strategies: Strategy[] = [
    new HttpRequestStrategy(),
  ];

  check(appMapData: AppMapData, assertion: Assertion): Boolean {
    for (let strategy of this.strategies) {
      if (strategy.supports(assertion)) {
        return strategy.check(appMapData, assertion);
      }
    }

    throw new AbortError(`Strategy not found for scope "${assertion.scope}".`);
  }
}
