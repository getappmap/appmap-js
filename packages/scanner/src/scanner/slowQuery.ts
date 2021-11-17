import { Event } from '@appland/models';
import { AssertionSpec } from 'src/types';
import * as types from './types';
import Assertion from '../assertion';

class Options implements types.SlowQuery.Options {
  public timeAllowed = 1;
}

function scanner(options: Options = new Options()): Assertion {
  return Assertion.assert(
    'slow-query',
    'Slow SQL queries',
    (e: Event) => e.elapsedTime! > options.timeAllowed,
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => !!e.sqlQuery && !!e.elapsedTime;
      assertion.description = `Slow SQL query (> ${options.timeAllowed * 1000}ms)`;
    }
  );
}

export default { Options, enumerateScope: true, scanner } as AssertionSpec;
