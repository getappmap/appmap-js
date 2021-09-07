import { Event } from '@appland/models';
import Assertion from './assertion';
import hasContentType from './scanner/hasContentType';
import isLeaf from './scanner/isLeaf';
import missingAuthentication from './scanner/missingAuthentication';
import nPlusOneQuery from './scanner/nPlusOneQuery';
import queryFromView from './scanner/queryFromView';
import slowHttpServerRequest from './scanner/slowHttpServerRequest';
import slowQuery from './scanner/slowQuery';
import validateBeforeSave from './scanner/validateBeforeSave';

const assertions: Assertion[] = [
  slowHttpServerRequest(),
  slowQuery(),
  queryFromView(),
  hasContentType(),
  missingAuthentication(),
  validateBeforeSave(),
  isLeaf('http_client_request'),
  isLeaf('sql_query'),
  isLeaf('function', (e: Event) => e.codeObject.labels.has('logging')),
  nPlusOneQuery({
    limit: { warning: 3, error: 10 },
    whitelist: [`SELECT * FROM "users" WHERE "id" = ?`],
  }),
];

export default function (): Assertion[] {
  return assertions;
}
