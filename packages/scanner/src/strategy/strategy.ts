import { AppMap, Event } from '@appland/models';
import Assertion from '../assertion';
import { Finding, Scope } from '../types';

export default abstract class Strategy {
  protected abstract scope: Scope;
  protected abstract isEventApplicable(event: Event): boolean;

  supports(assertion: Assertion): boolean {
    return assertion.scope === this.scope;
  }

  check(appMap: AppMap, assertion: Assertion, findings: Finding[]): void {
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
      if (assertion.include.length > 0 && !assertion.include.every((fn) => fn(e, appMap))) {
        continue;
      }
      if (assertion.exclude.length > 0 && assertion.exclude.some((fn) => fn(e, appMap))) {
        continue;
      }

      const buildFinding = (): Finding => {
        return {
          appMapName: appMap.metadata.name,
          scannerId: assertion.id,
          scannerTitle: assertion.summaryTitle,
          event: e,
          message: null,
          condition: assertion.description || assertion.matcher.toString(),
        };
      };

      const matchResult = assertion.matcher(e, appMap);
      if (matchResult === true) {
        findings.push(buildFinding());
      } else if (typeof matchResult === 'string') {
        const finding = buildFinding();
        finding.message = matchResult as string;
        findings.push(finding);
      } else if (matchResult) {
        matchResult.forEach((mr) => {
          const finding = buildFinding();
          if (mr.message) {
            finding.message = mr.message;
          }
          findings.push(finding);
        });
      }
    }
  }
}
