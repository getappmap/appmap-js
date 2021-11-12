import { Event } from '@appland/models';
import { AssertionSpec } from 'src/types';
import * as types from './types';
import Assertion from '../assertion';
import { toRegExpArray } from './util';

const WHITELIST = [/BEGIN/, /COMMIT/, /ROLLBACK/, /RELEASE/, /SAVEPOINT/];

class Options implements types.QueryFromInvalidPackage.Options {
  private _allowList: RegExp[];

  constructor(public parentPackages: string[] = [], allowList: RegExp[] = []) {
    this._allowList = allowList;
  }

  get allowList(): RegExp[] {
    return this._allowList;
  }

  set allowList(value: string[] | RegExp[]) {
    this._allowList = toRegExpArray(value);
  }
}

function scanner(options: Options): Assertion {
  return Assertion.assert(
    'query-from-invalid-package',
    'Queries from invalid packages',
    (e: Event) => {
      if (!options.parentPackages.includes(e.parent!.codeObject.packageOf)) {
        return `${e.codeObject.id} is invoked from illegal package ${
          e.parent!.codeObject.packageOf
        }`;
      }
    },
    (assertion: Assertion): void => {
      assertion.where = (e: Event) =>
        !!e.sqlQuery &&
        !!e.parent &&
        !options.allowList.concat(WHITELIST).some((pattern) => pattern.test(e.sqlQuery!));
      assertion.description = `Query must be invoked from one of (${options.parentPackages.join(
        ','
      )})`;
    }
  );
}

export default { Options, enumerateScope: true, scanner } as AssertionSpec;
