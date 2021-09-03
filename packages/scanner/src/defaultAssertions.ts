import Assertion from './assertion';
import hasContentType from './scanner/hasContentType';
import missingAuthentication from './scanner/missingAuthentication';
import queryFromView from './scanner/queryFromView';
import slowHttpServerRequest from './scanner/slowHttpServerRequest';
import slowQuery from './scanner/slowQuery';

const assertions: Assertion[] = [
  slowHttpServerRequest(),
  slowQuery(),
  queryFromView(),
  hasContentType(),
  missingAuthentication(),
];

export default function (): Assertion[] {
  return assertions;
}
