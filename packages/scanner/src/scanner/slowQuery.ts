import { Event } from '@appland/models';
import Assertion from '../assertion';
import { toRegExpArray } from './util';

class Options {
  private _queryInclude: RegExp[];
  private _queryExclude: RegExp[];

  constructor(
    public timeAllowed = 1,
    queryInclude = [/SELECT/i],
    queryExclude = [/pg_advisory_xact_lock/]
  ) {
    this._queryInclude = queryInclude;
    this._queryExclude = queryExclude;
  }

  get queryInclude(): RegExp[] {
    return this._queryInclude;
  }

  set queryInclude(value: string[] | RegExp[]) {
    this._queryInclude = toRegExpArray(value);
  }

  get queryExclude(): RegExp[] {
    return this._queryExclude;
  }

  set queryExclude(value: string[] | RegExp[]) {
    this._queryExclude = toRegExpArray(value);
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
        options.queryInclude.some((pattern) => e.sqlQuery!.match(pattern)) &&
        !options.queryExclude.some((pattern) => e.sqlQuery!.match(pattern));
      assertion.description = `Slow SQL query (> ${options.timeAllowed * 1000}ms)`;
    }
  );
}

export default { Options, scanner };
