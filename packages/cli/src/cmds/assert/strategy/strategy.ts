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

      if (assertion.where && !assertion.where(e, appMap)) {
        continue;
      }

      skipped = false;

      return assertion.assert(e, appMap);
    }

    return skipped ? null : true;
  }
}
