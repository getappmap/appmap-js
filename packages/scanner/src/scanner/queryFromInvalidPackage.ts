import { Event } from '@appland/models';
import { AssertionSpec } from 'src/types';
import * as types from './types';
import Assertion from '../assertion';
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

function scanner(options: Options): Assertion {
  const allowedPackages = buildFilters(options.allowedPackages);
  const allowedQueries = buildFilters(options.allowedQueries);

  return Assertion.assert(
    'query-from-invalid-package',
    'Queries from invalid packages',
    (e: Event) => {
      if (!allowedPackages.some((filter) => filter(e.parent!.codeObject.packageOf))) {
        return `${e.codeObject.id} is invoked from illegal package ${
          e.parent!.codeObject.packageOf
        }`;
      }
    },
    (assertion: Assertion): void => {
      assertion.where = (e: Event) =>
        !!e.sqlQuery && !!e.parent && !allowedQueries.some((pattern) => pattern(e.sqlQuery!));
      assertion.description = `Query must be invoked from one of (${options.allowedPackages.join(
        ','
      )})`;
    }
  );
}

export default { Options, enumerateScope: true, scanner } as AssertionSpec;
