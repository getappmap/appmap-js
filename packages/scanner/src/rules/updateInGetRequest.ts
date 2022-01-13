import { Event } from '@appland/models';
import { Rule, RuleLogic } from 'src/types';
import { toRegExpArray } from './lib/util';

class Options {
  private _queryInclude: RegExp[];
  private _queryExclude: RegExp[];

  constructor(
    queryInclude: RegExp[] = [/\binsert\b/i, /\bupdate\b/i],
    queryExclude: RegExp[] = []
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

function build(options: Options = new Options()): RuleLogic {
  return {
    matcher: (e) => {
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
        !e.ancestors().some((ancestor) => ancestor.codeObject.labels.has(Audit)) &&
        hasHttpServerRequest()
      ) {
        return `Data update performed in ${httpServerRequest!.route}: ${e.sqlQuery}`;
      }
    },
    where: (e) => !!e.sqlQuery,
  };
}

const Audit = 'audit';

export default {
  id: 'update-in-get-request',
  title: 'Data update performed in GET or HEAD request',
  scope: 'http_server_request',
  labels: [Audit],
  impactDomain: 'Maintainability',
  Options,
  build,
} as Rule;
