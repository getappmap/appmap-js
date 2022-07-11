import { Event } from '@appland/models';
import { MatchResult, Rule, RuleLogic } from '../types';
import * as types from './types';
import MatchPatternConfig from '../configuration/types/matchPatternConfig';
import { buildFilters } from './lib/matchPattern';
import { URL } from 'url';
import parseRuleDescription from './lib/parseRuleDescription';

// TODO: Use the Query AST for this.
const WHITELIST = [/\bBEGIN\b/i, /\bCOMMIT\b/i, /\bROLLBACK\b/i, /\bRELEASE\b/i, /\bSAVEPOINT\b/i];

class Options implements types.QueryFromInvalidPackage.Options {
  public allowedPackages: MatchPatternConfig[] = [];
  public allowedQueries: MatchPatternConfig[] = WHITELIST.map(
    (regexp) => ({ match: regexp } as MatchPatternConfig)
  );
}

function build(options: Options): RuleLogic {
  const allowedPackages = buildFilters(options.allowedPackages);
  const allowedQueries = buildFilters(options.allowedQueries);

  function matcher(e: Event): MatchResult[] | undefined {
    if (!e.parent) return;

    const parent = e.parent;
    if (!allowedPackages.some((filter) => filter(parent.codeObject.packageOf))) {
      return [
        {
          event: e,
          message: `${e.codeObject.id} is invoked from illegal package ${parent.codeObject.packageOf}`,
          participatingEvents: { parent: parent },
        },
      ];
    }
  }

  function where(e: Event) {
    return !!e.sqlQuery && !!e.parent && !allowedQueries.some((pattern) => pattern(e.sqlQuery!));
  }

  return {
    matcher,
    where,
  };
}

export default {
  id: 'query-from-invalid-package',
  title: 'Queries from invalid packages',
  Options,
  impactDomain: 'Maintainability',
  enumerateScope: true,
  references: {
    'CWE-1057': new URL('https://cwe.mitre.org/data/definitions/1057.html'),
  },
  description: parseRuleDescription('queryFromInvalidPackage'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#query-from-invalid-package',
  build,
} as Rule;
