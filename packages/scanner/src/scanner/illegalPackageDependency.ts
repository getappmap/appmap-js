import { Event } from '@appland/models';
import Assertion from '../assertion';
import minimatch from 'minimatch';
import { AssertionSpec } from 'src/types';

class Options {
  constructor(public selector: string = '*', public packageNames: string[] = []) {}
}

function scanner(options: Options): Assertion {
  const selectorExp = minimatch.makeRe(options.selector);
  const packageNamesStr = options.packageNames.join(' or ');

  return Assertion.assert(
    'illegal-package-dependency',
    'Illegal use of code by a non-whitelisted package',
    (e: Event) => {
      const parentPackage = e.parent!.codeObject.packageOf;
      if (
        !(
          e.codeObject.packageOf === parentPackage ||
          options.packageNames.some((pkg) => parentPackage === pkg)
        )
      ) {
        return `Code object ${e.codeObject.id} was invoked from ${parentPackage}, not from ${packageNamesStr}`;
      }
    },
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => {
        return (
          !!e.parent && !!e.parent!.codeObject.packageOf && selectorExp.test(e.codeObject.fqid)
        );
      };
      assertion.description = `Code object ${options.selector} must be invoked from package ${packageNamesStr}`;
    }
  );
}

export default { scanner, Options } as AssertionSpec;
