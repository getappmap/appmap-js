// @ts-ignore
import { Event } from '@appland/models';
import Assertion from '../assertion';

export default function (
  timeAllowed = 1,
  queryInclude = [/SELECT/],
  queryExclude = [/pg_advisory_xact_lock/]
) {
  return Assertion.assert(
    'sql_query',
    (e: Event) => e.elapsedTime !== undefined && e.elapsedTime < timeAllowed,
    (assertion: Assertion): void => {
      assertion.where = (e: Event) =>
        e.elapsedTime !== undefined &&
        queryInclude.every((pattern) => e.sqlQuery!.match(pattern)) &&
        !queryExclude.some((pattern) => e.sqlQuery!.match(pattern));
      assertion.description = `Slow SQL query (> ${timeAllowed * 1000}ms)`;
    }
  );
}
