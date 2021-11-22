import { Event } from '@appland/models';
import { AssertionSpec } from 'src/types';
import * as types from './types';
import Assertion from '../assertion';

// TODO: Use the Query AST for this.
const WHITELIST = [/\bBEGIN\b/i, /\bCOMMIT\b/i, /\bROLLBACK\b/i, /\bRELEASE\b/i, /\bSAVEPOINT\b/i];

class Options implements types.QueryFromInvalidPackage.Options {
  public allowedPackages: string[] = [];
  private _skipQueries: RegExp[] = WHITELIST;

  testQuery(query: string): boolean {
    return this._skipQueries.some((pattern) => pattern.test(query));
  }

  set skipQueries(value: string[]) {
    this._skipQueries = value.map((pattern) => new RegExp(pattern));
  }
}

function scanner(options: Options): Assertion {
  return Assertion.assert(
    'query-from-invalid-package',
    'Queries from invalid packages',
    (e: Event) => {
      if (!options.allowedPackages.includes(e.parent!.codeObject.packageOf)) {
        return `${e.codeObject.id} is invoked from illegal package ${
          e.parent!.codeObject.packageOf
        }`;
      }
    },
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => !!e.sqlQuery && !!e.parent && !options.testQuery(e.sqlQuery!);
      assertion.description = `Query must be invoked from one of (${options.allowedPackages.join(
        ','
      )})`;
    }
  );
}

export default { Options, enumerateScope: true, scanner } as AssertionSpec;
