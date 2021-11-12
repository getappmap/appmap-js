import { Event } from '@appland/models';
import { AssertionSpec } from 'src/types';
import * as types from './types';
import Assertion from '../assertion';
import { toRegExpArray } from './util';

class Options implements types.SlowQuery.Options {
  private _includeList: RegExp[];
  private _excludeList: RegExp[];

  constructor(
    public timeAllowed = 1,
    queryInclude = [/SELECT/i],
    queryExclude = [/pg_advisory_xact_lock/]
  ) {
    this._includeList = queryInclude;
    this._excludeList = queryExclude;
  }

  get includeList(): RegExp[] {
    return this._includeList;
  }

  set includeList(value: string[] | RegExp[]) {
    this._includeList = toRegExpArray(value);
  }

  get excludeList(): RegExp[] {
    return this._excludeList;
  }

  set excludeList(value: string[] | RegExp[]) {
    this._excludeList = toRegExpArray(value);
  }
}

function scanner(options: Options = new Options()): Assertion {
  return Assertion.assert(
    'slow-query',
    'Slow SQL queries',
    (e: Event) => e.elapsedTime! > options.timeAllowed,
    (assertion: Assertion): void => {
      assertion.where = (e: Event) =>
        !!e.sqlQuery &&
        !!e.elapsedTime &&
        options.includeList.some((pattern) => e.sqlQuery!.match(pattern)) &&
        !options.excludeList.some((pattern) => e.sqlQuery!.match(pattern));
      assertion.description = `Slow SQL query (> ${options.timeAllowed * 1000}ms)`;
    }
  );
}

export default { Options, enumerateScope: true, scanner } as AssertionSpec;
