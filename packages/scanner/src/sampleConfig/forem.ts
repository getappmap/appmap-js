import { Event } from '@appland/models';
import Assertion from '../assertion';
import missingContentType from '../scanner/missingContentType';
import leafExpected from '../scanner/leafExpected';
import missingAuthentication from '../scanner/missingAuthentication';
import slowHttpServerRequest from '../scanner/slowHttpServerRequest';
import slowQuery from '../scanner/slowQuery';

class SlowFunctionOptions {
  constructor(public timeAllowed: number = 1, public fn: string) {}
}

const slowFunction = function (options: SlowFunctionOptions): Assertion {
  return Assertion.assert(
    'slow-function',
    `Slow Function : ${options.fn}`,
    'function',
    (e: Event) => e.elapsedTime! < options.timeAllowed,
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => e.elapsedTime !== undefined && e.codeObject.id === options.fn;
      assertion.description = `Slow function ${options.fn} (> ${options.timeAllowed * 1000}ms)`;
    }
  );
};

const assertions: Assertion[] = [
  slowHttpServerRequest(),
  slowQuery(0.05),
  slowFunction({ timeAllowed: 0.05, fn: 'app/models/Article#comments_blob' }),
  missingContentType(),
  missingAuthentication(),
  leafExpected('http_client_request'),
  leafExpected('sql_query'),
];

export default function (): Assertion[] {
  return assertions;
}
