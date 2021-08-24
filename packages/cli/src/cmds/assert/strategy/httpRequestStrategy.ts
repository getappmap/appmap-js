import Strategy from './strategy';
import { AppMapData } from '../../../appland/types';
import Assertion from '../assertion';

export default class HttpRequestStrategy implements Strategy {
  check(appMap: AppMapData, assertion: Assertion): Boolean {
    for (let e of appMap.events) {
      if (e.hasOwnProperty('http_server_response') && !eval(assertion.assert)) {
        return false;
      }
    }

    return true;
  }

  supports(assertion: Assertion): Boolean {
    return assertion.scope === 'http_server_response';
  }
}
