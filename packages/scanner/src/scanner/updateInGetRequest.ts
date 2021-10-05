import { Event } from '@appland/models';
import Assertion from '../assertion';
import { toRegExpArray } from './util';

class Options {
  private _queryInclude: RegExp[];
  private _queryExclude: RegExp[];

  constructor(queryInclude: RegExp[] = [/INSERT/i, /UPDATE/i], queryExclude: RegExp[] = []) {
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
    'update-in-get-request',
    'Data update performed in GET or HEAD request',
    'sql_query',
    (e: Event) => {
      let httpServerRequest: Event | undefined;
      function hasHttpServerRequest() {
        httpServerRequest = e
          .ancestors()
          .find(
            (ancestor) =>
              ancestor.httpServerRequest &&
              ['head', 'get'].includes(ancestor.httpServerRequest.request_method.toLowerCase())
          );
        return httpServerRequest !== undefined;
      }

      if (
        options.queryInclude.some((pattern) => e.sqlQuery!.match(pattern)) &&
        !options.queryExclude.some((pattern) => e.sqlQuery!.match(pattern)) &&
        !e.ancestors().some((ancestor) => ancestor.codeObject.labels.has('log')) &&
        hasHttpServerRequest()
      ) {
        return `Data update performed in ${httpServerRequest!.route}: ${e.sqlQuery}`;
      }
    },
    (assertion: Assertion): void => {
      assertion.description = `Data update performed in GET or HEAD request`;
    }
  );
}

export default { Options, scanner };
