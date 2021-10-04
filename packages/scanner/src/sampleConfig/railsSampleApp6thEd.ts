import Assertion from '../assertion';
import missingContentType from '../scanner/missingContentType';
import leafExpected from '../scanner/leafExpected';
import missingAuthentication from '../scanner/missingAuthentication';
import slowHttpServerRequest from '../scanner/slowHttpServerRequest';
import slowQuery from '../scanner/slowQuery';
import updateInGetRequest from '../scanner/updateInGetRequest';
import secretInLog from '../scanner/secretInLog';

const assertions: Assertion[] = [
  slowHttpServerRequest.scanner(new slowHttpServerRequest.Options(0.5)),
  slowQuery.scanner(new slowQuery.Options(0.05)),
  missingContentType.scanner(),
  missingAuthentication.scanner(),
  leafExpected.scanner('http_client_request'),
  leafExpected.scanner('sql_query'),
  secretInLog.scanner(),
  updateInGetRequest.scanner(),
];

export default function (): Assertion[] {
  return assertions;
}
