import { Event } from '@appland/models';
import { Rule, RuleLogic } from 'src/types';
import * as types from './types';
import MatchPatternConfig from 'src/configuration/types/matchPatternConfig';
import { buildFilters } from './lib/matchPattern';

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

  function matcher(e: Event) {
    if (!allowedPackages.some((filter) => filter(e.parent!.codeObject.packageOf))) {
      return `${e.codeObject.id} is invoked from illegal package ${e.parent!.codeObject.packageOf}`;
    }
    return false;
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
  build,
} as Rule;
