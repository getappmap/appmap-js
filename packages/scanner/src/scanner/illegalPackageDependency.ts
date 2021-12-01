import { Event } from '@appland/models';
import Assertion from '../assertion';
import * as types from './types';
import { AssertionSpec } from 'src/types';
import MatchPatternConfig from 'src/configuration/types/matchPatternConfig';
import { buildFilter, buildFilters } from './lib/matchPattern';

class Options implements types.IllegalPackageDependency.Options {
  public callerPackages: MatchPatternConfig[] = [];
  public calleePackage: MatchPatternConfig = {} as MatchPatternConfig;
}

function scanner(options: Options): Assertion {
  const packageNamesStr = options.callerPackages
    .map((config) => config.equal || config.include || config.match)
    .map(String)
    .join(' or ');

  const callerPatterns = buildFilters(options.callerPackages || []);
  const calleePattern = buildFilter(options.calleePackage);

  return Assertion.assert(
    'illegal-package-dependency',
    'Illegal use of code by a non-whitelisted package',
    (e: Event) => {
      const parentPackage = e.parent!.codeObject.packageOf;
      if (
        !(
          e.codeObject.packageOf === parentPackage ||
          callerPatterns.some((pattern) => pattern(parentPackage))
        )
      ) {
        return `Code object ${e.codeObject.id} was invoked from ${parentPackage}, not from ${packageNamesStr}`;
      }
    },
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => {
        return (
          !!e.parent && !!e.parent!.codeObject.packageOf && calleePattern(e.codeObject.packageOf)
        );
      };
      assertion.description = `Code object must be invoked from package ${packageNamesStr}`;
    }
  );
}

export default { scanner, enumerateScope: true, Options } as AssertionSpec;
