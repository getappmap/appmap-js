import { Event } from '@appland/models';
import Assertion from '../assertion';

class UpdateInGetRequestOptions {
  constructor(
    public queryInclude: RegExp[] = [/INSERT/i, /UPDATE/i],
    public queryExclude: RegExp[] = []
  ) {}
}

function updateInGetRequest(
  options: UpdateInGetRequestOptions = new UpdateInGetRequestOptions()
): Assertion {
  return Assertion.assert(
    'update-in-get-request',
    'Data update performed in GET or HEAD request',
    'sql_query',
    (e: Event) =>
      !(
        options.queryInclude.some((pattern) => e.sqlQuery!.match(pattern)) &&
        !options.queryExclude.some((pattern) => e.sqlQuery!.match(pattern)) &&
        !e.ancestors().some((ancestor) => ancestor.codeObject.labels.has('log')) &&
        e
          .ancestors()
          .some(
            (ancestor) =>
              ancestor.httpServerRequest &&
              ['head', 'get'].includes(ancestor.httpServerRequest.request_method.toLowerCase())
          )
      ),
    (assertion: Assertion): void => {
      assertion.description = `Data update performed in GET or HEAD request`;
    }
  );
}

export default { options: UpdateInGetRequestOptions, scanner: updateInGetRequest };
