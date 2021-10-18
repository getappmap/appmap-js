import Assertion from '../assertion';
import missingContentType from '../scanner/missingContentType';
import missingAuthentication from '../scanner/missingAuthentication';
import slowHttpServerRequest from '../scanner/slowHttpServerRequest';
import slowQuery from '../scanner/slowQuery';
import updateInGetRequest from '../scanner/updateInGetRequest';
import secretInLog from '../scanner/secretInLog';
import insecureCompare from '../scanner/insecureCompare';

const assertions: Assertion[] = [
  slowHttpServerRequest.scanner(new slowHttpServerRequest.Options(0.5)),
  slowQuery.scanner(new slowQuery.Options(0.05)),
  missingContentType.scanner(),
  missingAuthentication.scanner(),
  secretInLog.scanner(),
  insecureCompare.scanner(),
  updateInGetRequest.scanner(),
];

export default function (): Assertion[] {
  return assertions;
}
