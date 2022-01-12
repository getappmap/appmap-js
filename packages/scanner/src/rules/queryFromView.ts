import { Event, Label } from '@appland/models';
import * as types from './types';
import { Rule, RuleLogic } from 'src/types';

class Options implements types.QueryFromView.Options {
  public forbiddenLabel: Label = 'mvc.template';
}

function build(options: Options = new Options()): RuleLogic {
  function matcher(e: Event) {
    return e.ancestors().some((e: Event) => e.codeObject.labels.has(options.forbiddenLabel));
  }
  function where(e: Event) {
    return !!e.sqlQuery;
  }

  return {
    matcher,
    where,
  };
}

export default {
  id: 'query-from-view',
  title: 'Queries from view',
  Options,
  impactDomain: 'Maintainability',
  enumerateScope: true,
  build,
} as Rule;
