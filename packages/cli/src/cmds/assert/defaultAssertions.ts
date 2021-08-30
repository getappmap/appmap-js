// @ts-ignore
import { Event } from '@appland/models';
import Assertion from './assertion';

const assertions: Assertion[] = [
  new Assertion('http_server_request', (e: Event) => e.elapsed < 1),
  new Assertion(
    'sql_query',
    (e: Event) => e.elapsedTime < 1,
    (e: Event) => e.sqlQuery.match(/SELECT/)
  ),
];

export default function () {
  return assertions;
}
