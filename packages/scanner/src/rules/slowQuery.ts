import { Rule, RuleLogic } from 'src/types';
import * as types from './types';

class Options implements types.SlowQuery.Options {
  public timeAllowed = 1;
}

function build(options: Options = new Options()): RuleLogic {
  return {
    matcher: (e) => e.elapsedTime! > options.timeAllowed,
    where: (e) => !!e.sqlQuery && !!e.elapsedTime,
  };
}

export default {
  id: 'slow-query',
  title: 'Slow SQL query',
  Options,
  enumerateScope: true,
  build,
} as Rule;
