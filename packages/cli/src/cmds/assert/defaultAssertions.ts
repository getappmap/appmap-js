// @ts-ignore
import Assertion from './assertion';
import queryFromView from './scanner/queryFromView';
import slowHttpServerRequest from './scanner/slowHttpServerRequest';
import slowQuery from './scanner/slowQuery';

const assertions: Assertion[] = [
  slowHttpServerRequest(),
  slowQuery(),
  queryFromView(),
];

export default function () {
  return assertions;
}
