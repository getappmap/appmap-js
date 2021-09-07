import { AppMap, Event } from '@appland/models';
import Assertion from '../assertion';
import { AssertionFailure, Scope } from '../types';

export default abstract class Strategy {
  protected abstract scope: Scope;
  protected abstract isEventApplicable(event: Event): boolean;

  supports(assertion: Assertion): boolean {
    return assertion.scope === this.scope;
  }

  check(appMap: AppMap, assertion: Assertion, failures: AssertionFailure[]): void {
    for (const e of appMap.events) {
      if (!e.isCall() || !e.returnEvent) {
        continue;
      }
      if (!this.isEventApplicable(e)) {
        continue;
      }

      if (assertion.where && !assertion.where(e, appMap)) {
        continue;
      }

      const succeeded = assertion.assert(e, appMap);
      if (!succeeded) {
        failures.push({
          appMapName: appMap.metadata.name,
          event: e,
          condition: assertion.description || assertion.assert.toString(),
        });
      }
    }
  }
}
