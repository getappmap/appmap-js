import { Event } from '@appland/models';
import Assertion from './assertion';
import hasContentType from './scanner/hasContentType';
import isLeaf from './scanner/isLeaf';
import missingAuthentication from './scanner/missingAuthentication';
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
];

export default function (): Assertion[] {
  return assertions;
}
