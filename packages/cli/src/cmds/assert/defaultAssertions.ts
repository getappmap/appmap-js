// @ts-ignore
import { Event } from '@appland/models';
import Assertion from './assertion';

const assertions: Assertion[] = [
  Assertion.assert(
    'http_server_request',
    (e: Event) => e.elapsedTime < 1,
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => e.elapsedTime;
      assertion.description = 'Slow HTTP server request';
    }
  ),
  Assertion.assert(
    'sql_query',
    (e: Event) => e.elapsedTime < 0.25,
    (assertion: Assertion): void => {
      assertion.where = (e: Event) =>
        e.elapsedTime &&
        e.sqlQuery.match(/SELECT/) &&
        !e.sqlQuery.match(/pg_advisory_xact_lock/);
      assertion.description = 'Slow SQL query';
    }
  ),
  Assertion.assert(
    'sql_query',
    (e: Event) =>
      e.ancestors().every((e: Event) => !e.codeObject.labels.has('mvc.view')),
    (assertion: Assertion): void => {
      assertion.description = 'SQL query from the view';
    }
  ),
];

export default function () {
  return assertions;
}
