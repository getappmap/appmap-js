import { Event } from '@appland/models';
import Assertion from '../assertion';
import missingContentType from '../scanner/missingContentType';
import leafExpected from '../scanner/leafExpected';
import missingAuthentication from '../scanner/missingAuthentication';
import nPlusOneQuery from '../scanner/nPlusOneQuery';
import queryFromView from '../scanner/queryFromView';
import slowHttpServerRequest from '../scanner/slowHttpServerRequest';
import slowQuery from '../scanner/slowQuery';
import saveWithoutValidation from '../scanner/saveWithoutValidation';

const assertions: Assertion[] = [
  slowHttpServerRequest.scanner(),
  slowQuery.scanner(new slowQuery.Options(0.05)),
  queryFromView.scanner(),
  missingContentType.scanner(),
  missingAuthentication.scanner(new missingAuthentication.Options([/\/api\//])),
  saveWithoutValidation.scanner(),
  leafExpected.scanner('http_client_request'),
  leafExpected.scanner('sql_query'),
  leafExpected.scanner('function', (e: Event) => e.codeObject.labels.has('log')),
  nPlusOneQuery.scanner(new nPlusOneQuery.Options(3, 10, [`SELECT * FROM "users" WHERE "id" = ?`])),
];

export default function (): Assertion[] {
  return assertions;
}
