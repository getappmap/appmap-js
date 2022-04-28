import { Event, Label } from '@appland/models';
import * as types from './types';
import { Rule, RuleLogic } from 'src/types';
import { URL } from 'url';
import parseRuleDescription from './lib/parseRuleDescription';

class Options implements types.QueryFromView.Options {
  public forbiddenLabel: Label = 'mvc.template';
}

function build(options: Options = new Options()): RuleLogic {
  function matcher(e: Event) {
    const forbiddenAncestor = e
      .ancestors()
      .find((e: Event) => e.codeObject.labels.has(options.forbiddenLabel));
    if (forbiddenAncestor) {
      return [
        {
          event: e,
          message: `SQL query is invoked from invalid event ${forbiddenAncestor}, labeled ${options.forbiddenLabel}`,
          relatedEvents: [forbiddenAncestor],
        },
      ];
    }
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
  description: parseRuleDescription('queryFromView'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#query-from-view',
  build,
} as Rule;
