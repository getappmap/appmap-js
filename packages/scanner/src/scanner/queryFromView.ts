import { Event, Label } from '@appland/models';
import { AssertionSpec } from 'src/types';
import Assertion from '../assertion';

class Options {
  constructor(public forbiddenLabel: Label = 'mvc.template') {}
}

function scanner(options: Options = new Options()): Assertion {
  return Assertion.assert(
    'query-from-view',
    'Queries from view',
    (e: Event) => e.ancestors().some((e: Event) => e.codeObject.labels.has(options.forbiddenLabel)),
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => !!e.sqlQuery;
      assertion.description = `SQL query from ${options.forbiddenLabel}`;
    }
  );
}

export default { Options, scanner } as AssertionSpec;
