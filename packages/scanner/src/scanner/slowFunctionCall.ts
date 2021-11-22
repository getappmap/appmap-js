import { Event } from '@appland/models';
import { AssertionSpec, ScopeName } from 'src/types';
import * as types from './types';
import Assertion from '../assertion';

class Options implements types.SlowFunctionCall.Options {
  public timeAllowed = 0.1;
}

function scanner(options: Options): Assertion {
  return Assertion.assert(
    'slow-function-call',
    'Slow function calls',
    (e: Event) => {
      if (e.returnEvent.elapsedTime! > options.timeAllowed) {
        return `Slow ${e.codeObject.id} call (${e.returnEvent.elapsedTime}ms)`;
      }
    },
    (assertion: Assertion): void => {
      assertion.where = (e: Event) =>
        e.isFunction && !!e.returnEvent && !!e.returnEvent.elapsedTime && !!e.codeObject.id;
      assertion.description = `Slow function call (> ${options.timeAllowed * 1000}ms)`;
    }
  );
}

export default {
  scope: 'root' as ScopeName,
  enumerateScope: true,
  Options,
  scanner,
} as AssertionSpec;
