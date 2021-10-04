import { Event } from '@appland/models';
import Assertion from '../assertion';
import { toRegExpArray } from './util';

const WHITELIST = [/BEGIN/, /COMMIT/, /ROLLBACK/, /RELEASE/, /SAVEPOINT/];

class Options {
  private _whitelist: RegExp[];

  constructor(public parentPackages: string[] = [], whitelist: RegExp[] = []) {
    this._whitelist = whitelist;
  }

  get whitelist(): RegExp[] {
    return this._whitelist;
  }

  set whitelist(value: string[] | RegExp[]) {
    this._whitelist = toRegExpArray(value);
  }
}

function scanner(options: Options): Assertion {
  return Assertion.assert(
    'query-from-invalid-package',
    'Queries from invalid packages',
    'event',
    (e: Event) => {
      if (!options.parentPackages.includes(e.parent!.codeObject.packageOf)) {
        return `${e.codeObject.id} is invoked from illegal package ${
          e.parent!.codeObject.packageOf
        }`;
      }
    },
    (assertion: Assertion): void => {
      assertion.where = (e: Event) =>
        e.sqlQuery !== undefined &&
        e.parent !== undefined &&
        !options.whitelist.concat(WHITELIST).some((pattern) => pattern.test(e.sqlQuery!));
      assertion.description = `Query must be invoked from one of (${options.parentPackages.join(
        ','
      )})`;
    }
  );
}

export default { Options, scanner };
