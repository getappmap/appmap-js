// @ts-ignore
import { Event } from '@appland/models';
import Assertion from '../assertion';
import { AppMapData } from '../../../appland/types';
import { Scope } from '../types';

export default abstract class Strategy {
  protected abstract scope: Scope;
  protected abstract isEventApplicable(event: Event): Boolean;

  supports(assertion: Assertion): Boolean {
    return assertion.scope === this.scope;
  }

  check(appMap: AppMapData, assertion: Assertion): Boolean | null {
    let skipped = true;

    for (let e of appMap.events) {
      if (!this.isEventApplicable(e)) {
        continue;
      }

      if (assertion.where && !eval(assertion.where)) {
        continue;
      }

      skipped = false;

      if (!eval(assertion.assert)) {
        return false;
      }
    }

    return skipped ? null : true;
  }
}
