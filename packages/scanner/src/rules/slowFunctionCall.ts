import { Rule, RuleLogic } from 'src/types';
import * as types from './types';
import MatchPatternConfig from 'src/configuration/types/matchPatternConfig';
import { buildFilters } from './lib/matchPattern';
import parseRuleDescription from './lib/parseRuleDescription';

class Options implements types.SlowFunctionCall.Options {
  public functions: MatchPatternConfig[] = [];
  public timeAllowed = 0.1;
}

function build(options: Options): RuleLogic {
  const functionPatterns = buildFilters(options.functions || []);

  return {
    matcher: (e) => {
      if (e.returnEvent.elapsedTime! > options.timeAllowed) {
        return `Slow ${e.codeObject.id} call (${e.returnEvent.elapsedTime}ms)`;
      }
    },
    where: (e) =>
      e.isFunction &&
      !!e.returnEvent &&
      !!e.returnEvent.elapsedTime &&
      !!e.codeObject.id &&
      (functionPatterns.length === 0 ||
        functionPatterns.some((pattern) => pattern(e.codeObject.id))),
  };
}

export default {
  id: 'slow-function-call',
  title: 'Slow function call',
  scope: 'root',
  impactDomain: 'Performance',
  enumerateScope: true,
  description: parseRuleDescription('slowFunctionCall'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#slow-function-call',
  Options,
  build,
} as Rule;
