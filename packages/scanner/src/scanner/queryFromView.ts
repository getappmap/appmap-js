import { Event } from '@appland/models';
import Assertion from '../assertion';

class Options {
  constructor(public forbiddenLabel = 'mvc.template') {}
}

function scanner(options: Options = new Options()): Assertion {
  return Assertion.assert(
    'query-from-view',
    'Queries from view',
    'sql_query',
    (e: Event) =>
      e.ancestors().every((e: Event) => !e.codeObject.labels.has(options.forbiddenLabel)),
    (assertion: Assertion): void => {
      assertion.description = `SQL query from ${options.forbiddenLabel}`;
    }
  );
}

export default { Options, scanner };
