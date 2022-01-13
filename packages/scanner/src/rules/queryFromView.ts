import { Event, Label } from '@appland/models';
import * as types from './types';
import { Rule, RuleLogic } from 'src/types';
import { URL } from 'url';

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
  references: {
    'CWE-1057': new URL('https://cwe.mitre.org/data/definitions/1057.html'),
  },
  build,
} as Rule;
