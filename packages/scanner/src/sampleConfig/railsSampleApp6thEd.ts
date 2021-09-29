import Assertion from '../assertion';
import missingContentType from '../scanner/missingContentType';
import leafExpected from '../scanner/leafExpected';
import missingAuthentication from '../scanner/missingAuthentication';
import slowHttpServerRequest from '../scanner/slowHttpServerRequest';
import slowQuery from '../scanner/slowQuery';
import updateInGetRequest from '../scanner/updateInGetRequest';

const assertions: Assertion[] = [
  slowHttpServerRequest(),
  slowQuery(0.05),
  missingContentType(),
  missingAuthentication(),
  leafExpected('http_client_request'),
  leafExpected('sql_query'),
  updateInGetRequest.scanner(),
];

export default function (): Assertion[] {
  return assertions;
}
