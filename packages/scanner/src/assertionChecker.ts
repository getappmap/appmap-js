import { AppMap } from '@appland/models';
import Assertion from './assertion';
import { AbortError } from './errors';
import { Finding } from './types';
import Strategy from './strategy/strategy';
import HttpServerRequestStrategy from './strategy/httpServerRequestStrategy';
import SqlQueryStrategy from './strategy/sqlQueryStrategy';
import EventStrategy from './strategy/eventStrategy';
import FunctionStrategy from './strategy/functionStrategy';
import HttpClientRequestStrategy from './strategy/httpClientRequestStrategy';
import { verbose } from './scanner/util';
import TransactionStrategy from './strategy/transactionStrategy';

export default class AssertionChecker {
  private strategies: Strategy[] = [
    new EventStrategy(),
    new FunctionStrategy(),
    new HttpClientRequestStrategy(),
    new HttpServerRequestStrategy(),
    new SqlQueryStrategy(),
    new TransactionStrategy(),
  ];

  check(appMapData: AppMap, assertion: Assertion, matches: Finding[]): void {
    if (verbose()) {
      console.warn(`Checking AppMap ${appMapData.name}`);
    }
    for (const strategy of this.strategies) {
      if (strategy.supports(assertion)) {
        return strategy.check(appMapData, assertion, matches);
      }
    }

    throw new AbortError(`Strategy not found for scope "${assertion.scope}".`);
  }
}
