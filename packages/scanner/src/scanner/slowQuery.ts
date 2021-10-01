import { Event } from '@appland/models';
import Assertion from '../assertion';

class Options {
  constructor(
    public timeAllowed = 1,
    public queryInclude = [/SELECT/i],
    public queryExclude = [/pg_advisory_xact_lock/]
  ) {}
}

function scanner(options: Options = new Options()): Assertion {
  return Assertion.assert(
    'slow-query',
    'Slow SQL queries',
    'sql_query',
    (e: Event) => e.elapsedTime! > options.timeAllowed,
    (assertion: Assertion): void => {
      assertion.where = (e: Event) =>
        e.elapsedTime !== undefined &&
        options.queryInclude.some((pattern) => e.sqlQuery && e.sqlQuery.match(pattern)) &&
        !options.queryExclude.some((pattern) => e.sqlQuery && e.sqlQuery.match(pattern));
      assertion.description = `Slow SQL query (> ${options.timeAllowed * 1000}ms)`;
    }
  );
}

export default { Options, scanner };
