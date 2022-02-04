import { Rule, RuleLogic } from 'src/types';
import * as types from './types';
import parseRuleDescription from './lib/parseRuleDescription';

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
  impactDomain: 'Performance',
  enumerateScope: true,
  description: parseRuleDescription('slowQuery'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#slow-query',
  build,
} as Rule;
