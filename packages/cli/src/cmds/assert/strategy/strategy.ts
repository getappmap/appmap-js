import Assertion from '../assertion';
import { AppMapData } from '../../../appland/types';

export default interface Strategy {
  supports(assertion: Assertion): Boolean;
  check(appMap: AppMapData, assertion: Assertion): Boolean;
}
