import { Event } from '@appland/models';
import Assertion from '../assertion';
import * as types from './types';
import { AssertionSpec } from 'src/types';

class Options implements types.IllegalPackageDependency.Options {
  public allowedPackages: string[] = [];
}

function scanner(options: Options): Assertion {
  const packageNamesStr = options.allowedPackages.join(' or ');

  return Assertion.assert(
    'illegal-package-dependency',
    'Illegal use of code by a non-whitelisted package',
    (e: Event) => {
      const parentPackage = e.parent!.codeObject.packageOf;
      if (
        !(
          e.codeObject.packageOf === parentPackage ||
          options.allowedPackages.some((pkg) => parentPackage === pkg)
        )
      ) {
        return `Code object ${e.codeObject.id} was invoked from ${parentPackage}, not from ${packageNamesStr}`;
      }
    },
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => {
        return !!e.parent && !!e.parent!.codeObject.packageOf;
      };
      assertion.description = `Code object must be invoked from package ${packageNamesStr}`;
    }
  );
}

export default { scanner, enumerateScope: true, Options } as AssertionSpec;
